-- =====================================================
-- WALLET TRANSACTIONS TABLE
-- Almacena el historial de transacciones de billetera
-- =====================================================

-- Crear tabla wallet_transactions si no existe
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('reload', 'purchase', 'refund')),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    description TEXT,
    reference_type VARCHAR(50), -- 'game', 'item', etc.
    reference_id UUID,
    idempotency_key VARCHAR(255) UNIQUE, -- Previene transacciones duplicadas
    balance_after DECIMAL(10, 2), -- Balance después de la transacción
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type_status ON public.wallet_transactions(type, status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_idempotency ON public.wallet_transactions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Asegurar que la columna balance existe en profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'balance'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
END $$;

-- Asegurar que la columna updated_at existe en profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Constraint para asegurar que el balance no sea negativo
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_balance_non_negative;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_balance_non_negative CHECK (balance >= 0);

-- =====================================================
-- FUNCIÓN RPC: reload_wallet
-- Recarga la billetera de forma atómica con bloqueo de fila
-- =====================================================
CREATE OR REPLACE FUNCTION public.reload_wallet(
    p_user_id UUID,
    p_amount DECIMAL(10, 2),
    p_idempotency_key VARCHAR(255),
    p_max_balance DECIMAL(10, 2) DEFAULT 10000.00
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance DECIMAL(10, 2);
    v_new_balance DECIMAL(10, 2);
    v_transaction_id UUID;
BEGIN
    -- Verificar si ya existe una transacción con este idempotency_key
    IF EXISTS (
        SELECT 1 FROM public.wallet_transactions 
        WHERE idempotency_key = p_idempotency_key 
        AND status IN ('pending', 'completed')
    ) THEN
        RAISE EXCEPTION 'Transacción duplicada detectada';
    END IF;

    -- Obtener y bloquear la fila del perfil (FOR UPDATE previene race conditions)
    SELECT balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    -- Calcular nuevo balance
    v_new_balance := COALESCE(v_current_balance, 0) + p_amount;

    -- Verificar límite máximo
    IF v_new_balance > p_max_balance THEN
        RAISE EXCEPTION 'El balance resultante excedería el límite máximo de $%', p_max_balance;
    END IF;

    -- Crear la transacción
    INSERT INTO public.wallet_transactions (
        user_id, 
        type, 
        amount, 
        status, 
        idempotency_key,
        description,
        balance_after
    ) VALUES (
        p_user_id,
        'reload',
        p_amount,
        'completed',
        p_idempotency_key,
        'Recarga de billetera',
        v_new_balance
    )
    RETURNING id INTO v_transaction_id;

    -- Actualizar el balance
    UPDATE public.profiles
    SET 
        balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Retornar resultado
    RETURN json_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'transaction_id', v_transaction_id
    );
END;
$$;

-- =====================================================
-- FUNCIÓN RPC: process_payment
-- Procesa un pago de forma atómica con bloqueo de fila
-- =====================================================
CREATE OR REPLACE FUNCTION public.process_payment(
    p_user_id UUID,
    p_amount DECIMAL(10, 2),
    p_description TEXT,
    p_idempotency_key VARCHAR(255),
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance DECIMAL(10, 2);
    v_new_balance DECIMAL(10, 2);
    v_transaction_id UUID;
BEGIN
    -- Verificar idempotency_key obligatorio
    IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
        RAISE EXCEPTION 'Se requiere un identificador único para el pago';
    END IF;

    -- Verificar si ya existe una transacción con este idempotency_key
    IF EXISTS (
        SELECT 1 FROM public.wallet_transactions 
        WHERE idempotency_key = p_idempotency_key 
        AND status IN ('pending', 'completed')
    ) THEN
        RAISE EXCEPTION 'Este pago ya fue procesado anteriormente';
    END IF;

    -- Obtener y bloquear la fila del perfil (FOR UPDATE previene race conditions)
    SELECT balance INTO v_current_balance
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario no encontrado';
    END IF;

    -- Verificar fondos suficientes
    IF COALESCE(v_current_balance, 0) < p_amount THEN
        RAISE EXCEPTION 'Fondos insuficientes. Tu balance es $% y el precio es $%.', v_current_balance, p_amount;
    END IF;

    -- Calcular nuevo balance
    v_new_balance := v_current_balance - p_amount;

    -- Crear la transacción (monto negativo para compras)
    INSERT INTO public.wallet_transactions (
        user_id, 
        type, 
        amount, 
        status, 
        idempotency_key,
        description,
        reference_type,
        reference_id,
        balance_after
    ) VALUES (
        p_user_id,
        'purchase',
        -p_amount,
        'completed',
        p_idempotency_key,
        p_description,
        p_reference_type,
        p_reference_id,
        v_new_balance
    )
    RETURNING id INTO v_transaction_id;

    -- Actualizar el balance
    UPDATE public.profiles
    SET 
        balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Retornar resultado
    RETURN json_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'transaction_id', v_transaction_id
    );
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Service role can update transactions" ON public.wallet_transactions;

-- Política: Los usuarios solo pueden ver sus propias transacciones
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: Solo el sistema puede insertar transacciones (via service role)
-- Los usuarios no pueden insertar directamente
CREATE POLICY "Service role can insert transactions" ON public.wallet_transactions
    FOR INSERT
    WITH CHECK (true);

-- Política: Solo el sistema puede actualizar transacciones
CREATE POLICY "Service role can update transactions" ON public.wallet_transactions
    FOR UPDATE
    USING (true);

-- =====================================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_wallet_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_transactions_updated_at ON public.wallet_transactions;

CREATE TRIGGER wallet_transactions_updated_at
    BEFORE UPDATE ON public.wallet_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_transactions_updated_at();

-- =====================================================
-- GRANTS: Permisos para las funciones RPC
-- =====================================================
GRANT EXECUTE ON FUNCTION public.reload_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_payment TO authenticated;
