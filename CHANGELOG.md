# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado [SemVer](https://semver.org/lang/es/): un cambio que obliga a migrar specs existentes o el archivo de memoria del proyecto es **mayor**; una regla o fase nueva es **menor**; una corrección de redacción es **parche**.

## [1.1.0] - 2026-10-20

### Cambiado

- `spec`: la "y" del pedido ya no divide la spec. En la Fase 0 solo marca un corte candidato, y la división la decide el control de tamaño, que ahora se mide al cerrar cada bloque de preguntas. La fila "y" de la tabla se reemplaza por una de bloqueo: una parte depende de un supuesto externo sin verificar que otra no necesita. Se agrega la regla de dónde cortar: cada parte con criterio propio y entregable sola, o, si no hay ese corte, entregas incrementales.

## [1.0.0] - 2026-10-18

### Cambiado

- README: secciones "Por qué" (el problema que resuelve) y "Cuándo usarlo" (qué tareas no necesitan spec y cuánto revisar). Parche.

## [1.0.0] - 2026-10-18

### Agregado

- `spec`: triaje del pedido, preguntas de aclaración, control de tamaño y escritura sección por sección. Incluye `template.md` y `scripts/specs-index.mjs`.
- `spec-impl`: implementación en modo normal o `--auto` y cierre con criterios, memoria, desviaciones y estado.
- `spec-areas`: adopción y revisión del vocabulario de áreas.
- `spec-retro`: retrospectiva de desviaciones con umbral de 2 specs.
