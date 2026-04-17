-- =====================================================
-- RLS Hardening: products table
-- Date: 2026-04-15
-- Author: Agent 1 - DevOps/Security
-- Status: PROOF OF CONCEPT (aplicar a dev/test primero)
-- =====================================================

-- 1. Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

-- 2. Policy: usuarios solo ven productos de su empresa
CREATE POLICY "products_select_policy" ON products
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 3. Policy: usuarios solo insertan productos de su empresa
CREATE POLICY "products_insert_policy" ON products
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 4. Policy: usuarios solo actualizan productos de su empresa
CREATE POLICY "products_update_policy" ON products
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 5. Policy: usuarios solo eliminan productos de su empresa
CREATE POLICY "products_delete_policy" ON products
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 6. Comentarios de auditoría
COMMENT ON TABLE products IS 'Catálogo de productos. RLS activo desde 2026-04-15. Políticas: solo lectura/escritura por company_id del usuario.';