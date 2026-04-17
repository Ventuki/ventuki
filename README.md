# Ventuki

Sistema POS SaaS construido con Vite, React, TypeScript, shadcn/ui y Supabase.

## Estado actual

- Frontend React con rutas protegidas y módulos por feature
- Integración con Supabase
- Suite de pruebas automatizadas activa con Vitest
- Build de producción funcional

## Stack principal

- Vite
- React 18
- TypeScript
- React Router
- TanStack Query
- Supabase
- Tailwind CSS + shadcn/ui
- Vitest
- Playwright

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
```

## Variables de entorno

Copia el archivo de ejemplo y completa los valores reales:

```bash
cp .env.example .env
```

Variables usadas actualmente:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`

## Desarrollo local

```bash
npm run dev
```

Normalmente Vite expone la app en `http://localhost:5173`.

## Build de producción

```bash
npm run build
npm run preview
```

## Pruebas

Ejecutar suite automatizada:

```bash
npm run test
```

Estado verificado en este mini-sprint:

- 15 archivos de prueba
- 25 pruebas aprobadas
- build de producción exitoso

## IDE recomendado

### Recomendación principal: VS Code

Por compatibilidad y productividad, la mejor opción para este proyecto es VS Code con:

- ESLint
- TypeScript y TS Server
- GitHub Desktop al lado para Git visual
- terminal integrada para `dev`, `build` y `test`

### Alternativa

- Cursor, si quieres apoyo extra de IA para refactors y navegación del código

## Flujo recomendado de trabajo

1. Crear o actualizar `.env` desde `.env.example`
2. Ejecutar `npm install`
3. Ejecutar `npm run dev`
4. Validar flujos clave manualmente
5. Ejecutar `npm run test`
6. Ejecutar `npm run build` antes de integrar cambios grandes

## Checklist manual de funcionamiento

### Acceso y arranque
- [ ] La app carga sin errores en local
- [ ] Login funciona correctamente
- [ ] Las rutas protegidas bloquean acceso sin sesión

### Operación principal
- [ ] Dashboard carga métricas sin error
- [ ] Productos permite listar y editar
- [ ] Inventario muestra existencias y movimientos
- [ ] POS permite armar carrito y registrar venta
- [ ] Compras permite registrar entrada de mercancía
- [ ] Clientes y proveedores cargan correctamente
- [ ] Apartados abre lista y detalle
- [ ] Facturación permite flujo básico sin errores visibles

### Calidad técnica
- [ ] `npm run test` pasa en limpio
- [ ] `npm run build` termina sin errores
- [ ] No se suben secretos reales al repo

## Riesgos técnicos detectados

- El bundle principal actual es pesado, alrededor de 1.3 MB minificado
- Hace falta completar documentación operativa de módulos y dependencias externas
- El entorno Supabase debe documentarse mejor para facilitar onboarding y QA

## Próximos pasos recomendados

1. Documentar módulos y dependencias por feature
2. Crear mapa de flujos críticos para QA manual
3. Reducir tamaño del bundle con lazy loading por rutas
4. Formalizar estrategia de agentes por perfil para trabajo incremental
