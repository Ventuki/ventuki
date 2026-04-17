-- SUPABASE AUDIT LOGS EVENT BUS
-- Registra eventos de UPDATE o DELETE sobre productos y previene fraude interno.

-- 1. Crear la Tabla de Logs de Auditoría
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID, -- Quien disparó el token en Supabase (Auth)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Asegurarse que es inmutable usando RLS
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
-- Solo inserciones permitidas por los Triggers. Nadie puede borrar logs.

-- 3. Crear Función Automática de Trigger en Postgres
CREATE OR REPLACE FUNCTION public.fn_audit_log_trigger()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Intentar obtener el user_id del JWT actual de Supabase
  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_audit_logs(table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW)::JSONB, v_user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Solo loguear si hubo un cambio real
    IF row_to_json(OLD)::JSONB IS DISTINCT FROM row_to_json(NEW)::JSONB THEN
      INSERT INTO public.system_audit_logs(table_name, record_id, action, old_data, new_data, changed_by)
      VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB, v_user_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.system_audit_logs(table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD)::JSONB, v_user_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Anexar el Trigger a la tabla Catalogos Principales (Ej. Productos)
DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();
