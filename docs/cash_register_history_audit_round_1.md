# Auditoría de historial y capa administrativa, Caja, ronda 1

## Hallazgo principal
Caja ya resuelve operación activa razonablemente bien, pero casi no expone lectura histórica útil dentro del propio módulo.

## Qué confirmé
### Sí existe hoy
- sesión activa
- resumen de sesión activa
- última sesión para dashboard
- apertura y cierre operativos

### No encontré hoy en Caja
- listado de sesiones previas
- historial navegable de arqueos
- lectura comparativa de diferencias previas
- vista administrativa simple de cierres recientes
- consulta clara de movimientos ligados a una sesión desde la pantalla de Caja

## Lectura actual
El módulo quedó bien para:
- operar la caja del turno actual

Pero quedó corto para:
- revisar qué pasó ayer
- ver últimos cierres
- detectar patrones de diferencia
- inspeccionar historial operativo sin ir a dashboard o base de datos

## Veredicto
El siguiente hueco real de Caja no parece ser otra transición ni CRUD.
Parece ser:
### **lectura histórica / capa administrativa complementaria**

---

## Slice recomendado
### Nombre sugerido
**Historial reciente de sesiones de caja**

### Alcance mínimo
1. listar últimas sesiones de caja del usuario/sucursal
2. mostrar:
   - apertura
   - cierre
   - fondo inicial
   - diferencia final
   - estado
3. permitir consultar resumen simple de una sesión cerrada reciente
4. dejar la operación activa separada del historial

## Recomendación de UX
No mezclarlo dentro del bloque de apertura/cierre principal.

Me parece mejor agregar una tarjeta o panel aparte tipo:
- `Historial reciente de caja`

## Conclusión
Caja ya no necesita discusión conceptual fuerte.
Necesita una pieza de lectura histórica pequeña y útil para completar la experiencia operativa.
