-- =====================================================
-- MIGRACIÓN: Configuración de Privacidad de Perfil
-- Fecha: 2026-01-18
-- Descripción: Añade columnas de privacidad para inventario, trades y marketplace
-- =====================================================

-- PASO 1: Eliminar TODOS los constraints existentes PRIMERO
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_inventory_privacy;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_trade_privacy;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_marketplace_privacy;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_inventory_privacy_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_trade_privacy_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_marketplace_privacy_check;

-- PASO 2: Añadir columnas si no existen (SIN constraint)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS inventory_privacy TEXT DEFAULT 'public';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trade_privacy TEXT DEFAULT 'public';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS marketplace_privacy TEXT DEFAULT 'public';

-- PASO 3: Normalizar TODOS los datos a minúsculas
UPDATE public.profiles SET inventory_privacy = LOWER(COALESCE(inventory_privacy, 'public'));
UPDATE public.profiles SET trade_privacy = LOWER(COALESCE(trade_privacy, 'public'));
UPDATE public.profiles SET marketplace_privacy = LOWER(COALESCE(marketplace_privacy, 'public'));

-- PASO 4: Corregir cualquier valor inválido
UPDATE public.profiles SET inventory_privacy = 'public' WHERE inventory_privacy NOT IN ('public', 'friends', 'private');
UPDATE public.profiles SET trade_privacy = 'public' WHERE trade_privacy NOT IN ('public', 'friends', 'private');
UPDATE public.profiles SET marketplace_privacy = 'public' WHERE marketplace_privacy NOT IN ('public', 'friends', 'private');

-- PASO 5: Ahora sí añadir los constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT chk_inventory_privacy CHECK (inventory_privacy IN ('public', 'friends', 'private'));

ALTER TABLE public.profiles 
ADD CONSTRAINT chk_trade_privacy CHECK (trade_privacy IN ('public', 'friends', 'private'));

ALTER TABLE public.profiles 
ADD CONSTRAINT chk_marketplace_privacy CHECK (marketplace_privacy IN ('public', 'friends', 'private'));

-- PASO 6: Establecer NOT NULL
ALTER TABLE public.profiles ALTER COLUMN inventory_privacy SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN trade_privacy SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN marketplace_privacy SET NOT NULL;

-- Índices para mejorar performance en consultas de privacidad
CREATE INDEX IF NOT EXISTS idx_profiles_inventory_privacy ON public.profiles(inventory_privacy);
CREATE INDEX IF NOT EXISTS idx_profiles_trade_privacy ON public.profiles(trade_privacy);
CREATE INDEX IF NOT EXISTS idx_profiles_marketplace_privacy ON public.profiles(marketplace_privacy);

-- Índices para optimizar consultas de amistad (si no existen)
CREATE INDEX IF NOT EXISTS idx_friendships_user1_status ON public.friendships(user_id1, status);
CREATE INDEX IF NOT EXISTS idx_friendships_user2_status ON public.friendships(user_id2, status);
CREATE INDEX IF NOT EXISTS idx_friendships_accepted ON public.friendships(user_id1, user_id2) WHERE status = 'accepted';

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON COLUMN public.profiles.inventory_privacy IS 'Nivel de privacidad del inventario: public (todos pueden ver), friends (solo amigos), private (solo el dueño)';
COMMENT ON COLUMN public.profiles.trade_privacy IS 'Nivel de privacidad para recibir trades: public (cualquiera), friends (solo amigos), private (nadie)';
COMMENT ON COLUMN public.profiles.marketplace_privacy IS 'Nivel de privacidad para compras en marketplace: public (cualquiera), friends (solo amigos), private (nadie)';

-- =====================================================
-- FUNCIÓN: Verificar si dos usuarios son amigos
-- =====================================================
CREATE OR REPLACE FUNCTION public.are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Si son el mismo usuario, retornar true (se considera "amigo" de sí mismo)
    IF user1_id = user2_id THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar si existe una amistad aceptada
    RETURN EXISTS (
        SELECT 1 FROM public.friendships
        WHERE status = 'accepted'
        AND (
            (user_id1 = user1_id AND user_id2 = user2_id)
            OR (user_id1 = user2_id AND user_id2 = user1_id)
        )
    );
END;
$$;

-- =====================================================
-- FUNCIÓN: Verificar permiso de acceso según privacidad
-- Retorna: true si tiene acceso, false si no
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_privacy_access(
    owner_id UUID,
    viewer_id UUID,
    privacy_type TEXT  -- 'inventory', 'trade', 'marketplace'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    privacy_setting TEXT;
BEGIN
    -- El dueño siempre tiene acceso
    IF owner_id = viewer_id THEN
        RETURN TRUE;
    END IF;
    
    -- Obtener la configuración de privacidad correspondiente
    SELECT 
        CASE privacy_type
            WHEN 'inventory' THEN inventory_privacy
            WHEN 'trade' THEN trade_privacy
            WHEN 'marketplace' THEN marketplace_privacy
            ELSE 'private'
        END INTO privacy_setting
    FROM public.profiles
    WHERE id = owner_id;
    
    -- Si no se encontró el perfil, denegar acceso
    IF privacy_setting IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Evaluar según el nivel de privacidad
    CASE privacy_setting
        WHEN 'public' THEN
            RETURN TRUE;
        WHEN 'private' THEN
            RETURN FALSE;
        WHEN 'friends' THEN
            -- Verificar amistad
            IF viewer_id IS NULL THEN
                RETURN FALSE;
            END IF;
            RETURN public.are_friends(owner_id, viewer_id);
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;

-- =====================================================
-- RLS POLICIES (Row Level Security) - Opcional pero recomendado
-- =====================================================
-- Habilitar RLS en profiles si no está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver su propia configuración de privacidad
DROP POLICY IF EXISTS "Users can view own privacy settings" ON public.profiles;
CREATE POLICY "Users can view own privacy settings" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Los usuarios pueden actualizar su propia configuración de privacidad
DROP POLICY IF EXISTS "Users can update own privacy settings" ON public.profiles;
CREATE POLICY "Users can update own privacy settings" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
