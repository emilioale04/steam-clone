-- =====================================================
-- PURCHASE MARKETPLACE ITEM - Transacción Atómica
-- Compra segura de items del marketplace
-- =====================================================

-- Comisión del marketplace (5%)
-- El vendedor recibe 95% del precio

CREATE OR REPLACE FUNCTION public.purchase_marketplace_item(
    p_buyer_id UUID,
    p_listing_id UUID,
    p_idempotency_key VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_listing RECORD;
    v_item RECORD;
    v_buyer_balance DECIMAL(10, 2);
    v_buyer_new_balance DECIMAL(10, 2);
    v_seller_balance DECIMAL(10, 2);
    v_seller_new_balance DECIMAL(10, 2);
    v_commission DECIMAL(10, 2);
    v_seller_receives DECIMAL(10, 2);
    v_buyer_tx_id UUID;
    v_seller_tx_id UUID;
    v_commission_rate CONSTANT DECIMAL(10, 2) := 0.05; -- 5% comisión
BEGIN
    -- ===========================================
    -- VALIDACIÓN DE IDEMPOTENCY KEY
    -- ===========================================
    IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN
        RAISE EXCEPTION 'Se requiere un identificador único para la compra';
    END IF;

    -- Verificar si ya existe una transacción con este idempotency_key
    IF EXISTS (
        SELECT 1 FROM public.wallet_transactions 
        WHERE idempotency_key = p_idempotency_key 
        AND status IN ('pending', 'completed')
    ) THEN
        RAISE EXCEPTION 'Esta compra ya fue procesada anteriormente';
    END IF;

    -- ===========================================
    -- OBTENER Y VALIDAR LISTING (con bloqueo)
    -- ===========================================
    SELECT 
        ml.id,
        ml.price,
        ml.status,
        ml.seller_id,
        ml.item_id
    INTO v_listing
    FROM public.marketplace_listings ml
    WHERE ml.id = p_listing_id
    FOR UPDATE; -- Bloquear fila para prevenir compras simultáneas

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La publicación no existe';
    END IF;

    IF v_listing.status != 'Active' THEN
        RAISE EXCEPTION 'Este artículo ya no está disponible para comprar';
    END IF;

    -- ===========================================
    -- VALIDAR QUE NO ES AUTO-COMPRA
    -- ===========================================
    IF v_listing.seller_id = p_buyer_id THEN
        RAISE EXCEPTION 'No puedes comprar tu propio artículo';
    END IF;

    -- ===========================================
    -- OBTENER Y VALIDAR ITEM (con bloqueo)
    -- ===========================================
    SELECT 
        i.id,
        i.owner_id,
        i.is_locked,
        i.name
    INTO v_item
    FROM public.items i
    WHERE i.id = v_listing.item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El artículo no existe';
    END IF;

    IF v_item.owner_id != v_listing.seller_id THEN
        RAISE EXCEPTION 'El artículo ya no pertenece al vendedor';
    END IF;

    -- ===========================================
    -- CALCULAR MONTOS
    -- ===========================================
    v_commission := ROUND(v_listing.price * v_commission_rate, 2);
    v_seller_receives := v_listing.price - v_commission;

    -- ===========================================
    -- VALIDAR BALANCE DEL COMPRADOR (con bloqueo)
    -- ===========================================
    SELECT balance INTO v_buyer_balance
    FROM public.profiles
    WHERE id = p_buyer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario comprador no encontrado';
    END IF;

    IF COALESCE(v_buyer_balance, 0) < v_listing.price THEN
        RAISE EXCEPTION 'Fondos insuficientes. Tu balance es $% y el precio es $%.', 
            COALESCE(v_buyer_balance, 0), v_listing.price;
    END IF;

    v_buyer_new_balance := v_buyer_balance - v_listing.price;

    -- ===========================================
    -- OBTENER BALANCE DEL VENDEDOR (con bloqueo)
    -- ===========================================
    SELECT balance INTO v_seller_balance
    FROM public.profiles
    WHERE id = v_listing.seller_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario vendedor no encontrado';
    END IF;

    v_seller_new_balance := COALESCE(v_seller_balance, 0) + v_seller_receives;

    -- ===========================================
    -- EJECUTAR TRANSACCIONES
    -- ===========================================

    -- 1. Registrar transacción del comprador (pago)
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
        p_buyer_id,
        'purchase',
        -v_listing.price,
        'completed',
        p_idempotency_key,
        'Compra en marketplace: ' || COALESCE(v_item.name, 'Item'),
        'marketplace_listing',
        v_listing.id,
        v_buyer_new_balance
    )
    RETURNING id INTO v_buyer_tx_id;

    -- 2. Registrar transacción del vendedor (venta)
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
        v_listing.seller_id,
        'sale',
        v_seller_receives,
        'completed',
        p_idempotency_key || '_seller',
        'Venta en marketplace: ' || COALESCE(v_item.name, 'Item') || ' (comisión 5%)',
        'marketplace_listing',
        v_listing.id,
        v_seller_new_balance
    )
    RETURNING id INTO v_seller_tx_id;

    -- 3. Actualizar balance del comprador
    UPDATE public.profiles
    SET 
        balance = v_buyer_new_balance,
        updated_at = NOW()
    WHERE id = p_buyer_id;

    -- 4. Actualizar balance del vendedor
    UPDATE public.profiles
    SET 
        balance = v_seller_new_balance,
        updated_at = NOW()
    WHERE id = v_listing.seller_id;

    -- 5. Transferir propiedad del item y desbloquearlo
    UPDATE public.items
    SET 
        owner_id = p_buyer_id,
        is_locked = false,
        updated_at = NOW()
    WHERE id = v_listing.item_id;

    -- 6. Marcar listing como vendido
    UPDATE public.marketplace_listings
    SET 
        status = 'Sold',
        buyer_id = p_buyer_id,
        sold_at = NOW(),
        updated_at = NOW()
    WHERE id = p_listing_id;

    -- ===========================================
    -- RETORNAR RESULTADO
    -- ===========================================
    RETURN json_build_object(
        'success', true,
        'message', 'Compra realizada exitosamente',
        'item_name', v_item.name,
        'price_paid', v_listing.price,
        'buyer_new_balance', v_buyer_new_balance,
        'buyer_transaction_id', v_buyer_tx_id,
        'seller_receives', v_seller_receives,
        'commission', v_commission
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Re-lanzar la excepción con el mensaje original
        RAISE;
END;
$$;

-- =====================================================
-- ACTUALIZAR TABLA wallet_transactions para soportar 'sale'
-- =====================================================
ALTER TABLE public.wallet_transactions 
DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;

ALTER TABLE public.wallet_transactions 
ADD CONSTRAINT wallet_transactions_type_check 
CHECK (type IN ('reload', 'purchase', 'sale', 'refund'));

-- =====================================================
-- AGREGAR COLUMNAS A marketplace_listings SI NO EXISTEN
-- =====================================================
DO $$
BEGIN
    -- Columna buyer_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'buyer_id'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN buyer_id UUID REFERENCES auth.users(id);
    END IF;

    -- Columna sold_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'sold_at'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN sold_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Columna updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'marketplace_listings' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.marketplace_listings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- AGREGAR COLUMNA updated_at A items SI NO EXISTE
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'items' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- ÍNDICE para búsquedas de compras por buyer_id
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_buyer_id 
ON public.marketplace_listings(buyer_id) 
WHERE buyer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status 
ON public.marketplace_listings(status);

-- =====================================================
-- GRANTS
-- =====================================================
GRANT EXECUTE ON FUNCTION public.purchase_marketplace_item TO authenticated;
