# Contexto y onboarding, backlog técnico de corrección

## Objetivo
Cerrar el arranque contextual del sistema para que el usuario llegue a operar con empresa, sucursal y recorrido inicial claros.

---

# Hallazgo crítico

Actualmente existen dos implementaciones de onboarding:

- `src/features/auth/pages/OnboardingPage.tsx`
- `src/features/onboarding/pages/OnboardingPage.tsx`

Esto introduce duplicidad conceptual y riesgo de evolución divergente.

## Lectura actual
- la ruta activa en `App.tsx` usa `@/features/auth/pages/OnboardingPage`,
- pero existe un onboarding más rico y más alineado a operación en `features/onboarding/`.

## Conclusión
Antes de seguir endureciendo el circuito base, hay que decidir cuál onboarding es canónico.

---

# Selección de empresa / contexto

## Archivos foco
- `src/features/auth/pages/SelectCompanyPage.tsx`
- `src/features/auth/AuthProvider.tsx`
- `src/features/auth/ProtectedRoute.tsx`
- `src/components/layout/AppTopbar.tsx`

## Estado actual
- el contexto empresa/sucursal se persiste en localStorage,
- `ProtectedRoute` exige empresa y sucursal,
- el topbar permite cambiar empresa y sucursal,
- el contexto básico está funcional.

## Limitantes actuales
- no hay señal operativa fuerte del contexto activo más allá del topbar,
- no está explícito qué pasa si una empresa no tiene sucursales operativas o configuración incompleta,
- el circuito post-onboarding aún no está alineado con el circuito de venta.

## Trabajo técnico
- [ ] definir estado "contexto listo para operar".
- [ ] revisar si el topbar debe reforzar empresa, sucursal y rol actual.
- [ ] revisar flujo si hay empresa sin sucursales o sin almacén operativo.
- [ ] definir si el dashboard debe alertar falta de contexto operativo adicional.

---

# Onboarding

## Archivos foco
- `src/features/auth/pages/OnboardingPage.tsx`
- `src/features/onboarding/pages/OnboardingPage.tsx`
- `src/features/onboarding/hooks/useOnboarding.ts`
- componentes `steps/*`

## Estado actual
### Onboarding activo en auth
- crea empresa,
- crea sucursal,
- crea almacén,
- y navega al dashboard.

### Onboarding alterno en feature dedicada
- incluye pasos más ricos,
- incluye caja y usuario,
- parece más cercano a una experiencia operacional completa.

## Problema
El sistema tiene una intención de onboarding mejor, pero no está usando esa versión como flujo principal.

## Trabajo técnico
- [ ] decidir onboarding canónico.
- [ ] evitar que convivan dos flujos principales en paralelo.
- [ ] definir salida operativa después de crear empresa.
- [ ] diseñar paso siguiente al onboarding:
  - ir a dashboard,
  - o ir a configuración mínima,
  - o flujo guiado de primera venta.
- [ ] definir qué mínima preparación falta después de onboard:
  - caja,
  - productos,
  - stock,
  - métodos de pago.

## Recomendación actual
Tomar como base el onboarding más rico de `features/onboarding`, pero solo después de validar que el flujo no romperá el circuito base ni agregará complejidad excesiva.

Mientras tanto, documentar claramente que el onboarding activo hoy no deja lista la operación.

---

# Resultado esperado de este frente

Dejar claro:
- cómo entra el usuario al sistema,
- con qué contexto mínimo,
- qué onboarding manda,
- y qué falta para quedar listo para operar.
