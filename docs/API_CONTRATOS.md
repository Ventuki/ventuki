# Contratos API internos (Fases 1–3)

## Edge Function: `onboard-company`

### Request
```json
{
  "company_name": "Ferretería Central",
  "company_slug": "ferreteria-central",
  "company_phone": "5551234567",
  "company_email": "admin@ferreteria.com",
  "branch_name": "Principal",
  "branch_address": "Centro",
  "branch_phone": "5559998888",
  "warehouse_name": "Almacén Principal"
}
```

### Response
```json
{
  "data": {
    "company_id": "uuid",
    "company_name": "Ferretería Central",
    "company_slug": "ferreteria-central",
    "branch_id": "uuid",
    "branch_name": "Principal",
    "warehouse_id": "uuid",
    "cash_register_id": "uuid"
  }
}
```

---

## RPC: `adjust_stock`

### Parámetros
- `_company_id` (uuid)
- `_warehouse_id` (uuid)
- `_product_id` (uuid)
- `_delta` (numeric, no puede ser 0)
- `_movement_type` (`adjustment_in` | `adjustment_out` | ...)
- `_notes` (text|null)

### Reglas de negocio
- Usuario autenticado obligatorio.
- Usuario debe pertenecer a la empresa.
- No se permite stock negativo.
- No se permite decremento sobre stock inexistente.

### Respuesta
```json
{
  "company_id": "uuid",
  "warehouse_id": "uuid",
  "product_id": "uuid",
  "new_quantity": 12.5
}
```
