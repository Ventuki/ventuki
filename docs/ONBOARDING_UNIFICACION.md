# Unificación de onboarding

## Decisión tomada
Se consolidó un solo onboarding operativo para la app: `src/features/auth/pages/OnboardingPage.tsx`.

## Motivo
El onboarding alterno en `src/features/onboarding/` estaba incompleto:
- no persistía datos reales,
- simulaba guardado,
- intentaba navegar a `/dashboard`, ruta inexistente,
- y duplicaba responsabilidad funcional.

## Estado actual
- El onboarding válido y operativo es el de `features/auth/pages/OnboardingPage.tsx`.
- El onboarding alterno queda explícitamente descontinuado.
- Cualquier referencia futura debe converger al flujo unificado.

## Siguiente trabajo recomendado
- Retirar o archivar por completo `src/features/onboarding/` en una limpieza posterior.
- Si se rescata algo de ahí, debe migrarse deliberadamente al onboarding unificado, no coexistir como segundo flujo.
