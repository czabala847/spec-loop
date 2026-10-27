# spec-loop — reglas para mantener las skills

Este repo es la **fuente** de las skills; los proyectos las instalan con `npx skills add`. Todo cambio aquí llega a todos los proyectos.

- **Nada acoplado a un proyecto, stack, sistema operativo o agente.** Lo específico de un repo lo declara su archivo de memoria y las skills lo leen de ahí. Ejemplos de herramientas de un agente van con "p. ej.", nunca como requisito.
- **El bloque "Lectura y búsqueda" está repetido a propósito** en las cinco skills (cada una se instala por separado). Si cambias uno, cambia los cinco igual.
- **Referencias entre skills, siempre relativas a la hermana** (`../spec/template.md`), porque `spec-impl`, `spec-areas`, `spec-retro` y `spec-consolidar` dependen de `spec`.
- **Scripts auxiliares en Node sin dependencias** (`.mjs`): Node es lo único garantizado en cualquier máquina.
- **Cada cambio entra al `CHANGELOG.md`** con su tipo de versión, y se publica con un tag `vX.Y.Z`.
- Nunca hacer commit sin confirmación explícita del dev.
