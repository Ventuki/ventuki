-- =====================================================
-- RLS Hardening: branches table
-- Date: 2026-04-15
-- Author: Agent 1 - DevOps/Security
-- =====================================================

-- 1. Habilitar RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches FORCE ROW LEVEL SECURITY;

-- 2. Policy: usuarios solo ven sucursales de su empresa
CREATE POLICY "branches_select_policy" ON branches
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 3. Policy: usuarios solo insertan sucursales de su empresa
CREATE POLICY "branches_insert_policy" ON branches
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 4. Policy: usuarios solo actualizan sucursales de su empresa
CREATE POLICY "branches_update_policy" ON branches
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

-- 5. Policy: usuarios solo eliminan sucursales de su empresa
CREATE POLICY "branches_delete_policy" ON branches
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 6. Comentario
COMMENT ON TABLE branches IS 'Sucursales por empresa. RLS activo desde 2026-04-15. Políticas por company_id.';