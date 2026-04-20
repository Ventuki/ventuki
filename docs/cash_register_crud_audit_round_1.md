# Auditoría CRUD, Caja, ronda 1

## Alcance revisado
- `src/features/cash-register/pages/CashRegisterPage.tsx`
- `src/features/cash-register/infrastructure/cash.repository.ts`
- `src/features/cash-register/application/openSession.usecase.ts`
- `src/features/cash-register/application/closeSession.usecase.ts`
- intento de lectura de `src/features/cash-register/application/getSessionSummary.usecase.ts` → no existe

## Resumen ejecutivo
Caja no es CRUD clásico.
Es un flujo operativo de sesión con dos acciones principales:
- abrir caja,
- cerrar caja.

Y alrededor de eso hay consulta de sesión activa, resumen del turno y arqueo por método de pago.

Si alguien espera CRUD administrativo de sesiones de caja, la pantalla sí se sentirá limitada.
Pero desde negocio, lo correcto probablemente no sea CRUD libre sino operación controlada.

## C, Create
### Estado
Funcional como apertura de sesión.

### Evidencia
- Existe `openSessionUseCase`.
- Se valida que no haya sesión abierta previa del mismo usuario en la sucursal.
- Se crea sesión de caja con fondo inicial.

### Observaciones
Aquí el “create” real es abrir una sesión, no crear registros arbitrarios.

### Riesgo
Bajo.

## R, Read
### Estado
Funcional para operación, parcial para administración.

### Evidencia
- Se consulta sesión activa.
- Se consulta resumen de sesión.
- Se muestran esperados y contados por método.
- Existe consulta de última sesión en repositorio.

### Hallazgo importante
No existe `getSessionSummary.usecase.ts` en la ruta esperada.
El resumen se resuelve directo desde repositorio en la pantalla.

### Observaciones
La lectura sirve para operar.
Pero a nivel de arquitectura hay una inconsistencia: parte del comportamiento parece estar demasiado pegado al repositorio y no encapsulado en caso de uso.

### Riesgo
Medio.
No necesariamente rompe la pantalla, pero sí apunta a cierre incompleto de capa de aplicación.

## U, Update
### Estado
No aplica como update CRUD clásico.

### Qué sí existe
- Cierre de sesión con captura de montos contados.
- Registro de diferencia final.
- Notas de cierre.

### Observaciones
Cerrar caja técnicamente modifica la sesión, pero no es “editar caja” en sentido CRUD.
Es una transición operativa de estado.

### Riesgo
Bajo si se entiende como flujo.

## D, Delete
### Estado
No aplica.

### Evidencia
- No existe eliminación de sesiones de caja desde esta UI.
- Tampoco debería ser el comportamiento normal de negocio.

### Riesgo
Bajo.

## Hallazgos prioritarios

### 1. Caja no debe evaluarse como CRUD tradicional
Prioridad: Alta de claridad conceptual
- La unidad real es la sesión operativa, no un registro editable arbitrariamente.

### 2. Inconsistencia de arquitectura en lectura de resumen
Prioridad: Media-Alta
- Se intentó ubicar `getSessionSummary.usecase.ts` y no existe.
- Parte de la lógica de consulta vive directo en repositorio + página.
- Esto sugiere que la capa de aplicación no está completamente cerrada.

### 3. Read operativo sí existe, pero no una administración completa de historial
Prioridad: Media
- La pantalla resuelve bien apertura/cierre de la sesión activa.
- No parece existir aquí una pantalla administrativa más completa de sesiones previas, auditoría histórica o correcciones.

## Veredicto
### Caja NO está rota por falta de CRUD,
porque realmente no es una pantalla CRUD.

Mi lectura actual sería:
- **Create:** sí, como apertura de sesión
- **Read:** bien para operación activa, parcial para administración
- **Update:** sí, pero como cierre/arqueo, no como edición libre
- **Delete:** no aplica

## Implicación importante
Con Caja ya se refuerza mucho la hipótesis global:
varios módulos críticos del sistema no son CRUD y no deberían evaluarse solo con esa expectativa.

Lo que sí conviene auditar ahora es:
- si la UX deja claro que son flujos operativos,
- y si hay huecos de administración complementaria donde sí falta una pantalla aparte.

## Siguiente paso recomendado
1. Auditar **POS**.
2. Después consolidar una matriz global por pantalla:
- CRUD real,
- flujo operativo,
- híbrido,
- y dónde falta administración complementaria.
