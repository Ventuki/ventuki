-- =====================================================
-- RLS Hardening: warehouses table
-- Date: 2026-04-15
-- Author: Agent 1 - DevOps/Security
-- =====================================================

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;

CREATE POLICY "warehouses_select_policy" ON warehouses
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "warehouses_insert_policy" ON warehouses
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "warehouses_update_policy" ON warehouses
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

CREATE POLICY "warehouses_delete_policy" ON warehouses
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

COMMENT ON TABLE warehouses IS 'Almacenes por sucursal. RLS activo desde 2026-04-15. Políticas por company_id.';