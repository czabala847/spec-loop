---
name: spec-retro
description: 'Retrospectiva del proceso spec-driven. Lee solo la sección "Desviaciones" de las specs cerradas que siguen con `Retro: pendiente`, agrupa las entradas por causa y, para las causas que se repiten en 2 o más specs, recomienda cambios concretos a `/spec` (template, preguntas de la Fase 2, control de tamaño) o a `/spec-impl`. No edita las skills: el dev decide dónde aplicar cada recomendación. Al terminar marca esas specs como revisadas. Úsala cuando `/spec-impl` avise que hay ~10 specs sin retro.'
disable-model-invocation: true
argument-hint: '[sin argumentos]'
---

# /spec-retro — Lo que el proceso aprendió de las últimas specs

`/spec-impl` deja en cada spec cerrada una sección `## Desviaciones`: las ambigüedades que la spec no resolvía, los pasos que hubo que partir o reordenar, y los criterios mal escritos, cada uno con la pieza del proceso que debió atraparlo. Esta skill junta esas secciones y convierte lo que se repite en recomendaciones de cambio a las skills. Así mejora el proceso, no solo el código.

**Aquí no se escribe código de la aplicación ni se editan las skills.** Las skills instaladas en un proyecto son una copia: una actualización pisaría cualquier cambio local. Por eso esta skill solo recomienda, y el dev decide dónde aplica cada cambio: en la fuente de las skills (para que llegue a todos los proyectos) o en el archivo de memoria del proyecto (si es un ajuste solo de este repo).

Lo único que esta skill escribe es la línea `> Retro:` de la sección Desviaciones de cada spec que leyó. Nada más de la spec.

Responde en el idioma del repo (el de las specs).

**Lectura y búsqueda.** Para leer, listar o buscar texto en archivos, en este orden:

1. **Las herramientas nativas de tu agente** (leer archivo, buscar texto, buscar archivos; p. ej. Read, Grep y Glob en Claude Code). Si las tienes, úsalas siempre.
2. **Si tu agente no tiene búsqueda nativa**, un solo `git grep` con el patrón de abajo: `git grep --untracked -n -E '<patrón>' -- ':(glob)specs/[0-9]*.md'` (`-l` en vez de `-n` si solo necesitas los nombres de archivo). Siempre con comillas simples: son literales en Bash, zsh y PowerShell, y las dobles alteran los backticks del patrón; si tu shell trata distinto las comillas simples, adapta el escape, no el patrón. Así se escribe igual en todas, y ya deja fuera `README.md`, `INDEX.md` y `archive/`. **Código de salida 1 sin salida significa 0 coincidencias, no un error:** no reintentes con otro patrón.
3. Nunca `cat`, `ls`, `grep`, `find`, `Select-String` ni `Get-Content` sueltos. Y estas búsquedas (specs, campos del header, secciones) las haces tú, en una sola llamada: **no las delegues a un subagente**. Su resultado ya es corto, así que delegar no ahorra contexto; solo suma tiempo, y el subagente no hereda estas reglas.

- **Specs del repo:** archivos del primer nivel de `specs/` cuyo nombre empieza con dígito (`AAAAMMDD-slug.md` o legacy `NN-slug.md`). Descarta `README.md`, `INDEX.md` y cualquier resultado bajo `specs/archive/`.
- **Campos del header** (`Estado`, `Área`, `Objetivo`…): un solo patrón para cualquier campo, cambiando la etiqueta: `^>?[[:space:]]*\*\*(.*\*\*)?(<etiqueta>):\*\*`. Por ejemplo, `^>?[[:space:]]*\*\*(.*\*\*)?(Estado|Status):\*\*`. Tolera el `> ` del blockquote, encuentra el campo esté al inicio o en medio de la línea y no atrapa menciones del campo en el cuerpo. Una sola búsqueda devuelve archivo y valor de todas a la vez. Si alguna spec no aparece (usa otro idioma en la etiqueta), lee solo sus primeras 8 líneas.
- **Secciones:** ubica `^## ` en el archivo y lee solo el rango de líneas que necesitas.

## Fase 1 — Juntar

1. Busca los archivos que contienen la línea `> Retro: pendiente`, buscando `^> Retro: pendiente` por la vía del bloque de arriba (con `git grep`, usa `-l`). **Identifica cada spec por su ID (el nombre de archivo sin `.md`)**, nunca por un número: en repos con specs legacy `NN-slug.md` el número puede repetirse entre devs.
2. Saca las entradas de todas a la vez con **una sola búsqueda limitada a esos archivos** (con `git grep`, lístalos después del `--` en vez del glob), sin ubicar encabezados ni abrir spec por spec. Cada entrada de Desviaciones ocupa una línea y termina con su causa del vocabulario cerrado de `template.md` (en el directorio de la skill `/spec`), así que este patrón devuelve exactamente las entradas y las secciones vacías:

   ```
   → `(fase0|fase2:[a-zñóú]+|tamaño|plantilla:[a-zñóú]+|spec-impl)`|^Sin desviaciones
   ```

   Cada línea es una entrada con su causa, o la marca de una spec limpia. Con eso se arma la tabla de la Fase 2.
3. **Una spec pendiente que no devuelve ninguna línea** tiene una entrada con una causa fuera del vocabulario o una sección mal formada: lee solo su sección `## Desviaciones`, con la regla de secciones del bloque de arriba, y señálalo en la Fase 2. No leas cuerpos enteros: con 10 specs agotarías el contexto antes de proponer nada. Si una entrada no se entiende sin contexto, lee solo la sección de la spec a la que se refiere.

Si hay menos de 5 specs pendientes, dilo y pregunta si sigue igual: con pocos datos casi nada va a pasar el umbral.

## Fase 2 — Agrupar

Muestra una tabla por causa, de la más frecuente a la menos:

```
| Causa | Specs | Entradas |
| --- | --- | --- |
| fase2:datos | 20261002-foo.md, 20261009-bar.md, 20261014-baz.md | 3 |
| plantilla:criterios | 20261006-qux.md | 1 |
```

Debajo, en una línea: `N specs leídas · M sin desviaciones · K entradas`. Las specs limpias también son un dato: si casi todas lo son, el proceso está bien y está bien decirlo.

Si una entrada tiene una causa que no está en el vocabulario del template, o una causa que no corresponde a lo que describe, señálalo y propón la correcta antes de agrupar.

## Fase 3 — Proponer

**Umbral: solo se propone un cambio para una causa que aparece en 2 o más specs distintas.** Una entrada aislada se lista como "vista, sin patrón" y no genera nada. Sin ese umbral, el template crece con cada anécdota y deja de leerse.

Antes de proponer, busca `\(retro [0-9]{4}-` (por la vía del bloque de arriba; con `git grep`, la ruta es la de las skills, no `specs/`) en las skills `spec` y `spec-impl` instaladas —hermanas de esta— y en el archivo de memoria del proyecto si una retro anterior ya agregó una regla para esa causa (las reglas de una retro llevan su origen, ver abajo). Si existe y la causa volvió a aparecer, **la regla no funcionó: propón reescribirla, no apilar otra al lado.**

Cada propuesta lleva:

- La causa y las entradas que la motivan, citadas por nombre de archivo.
- El archivo y el lugar exacto: `template.md` (una sección), las categorías o preguntas de la Fase 2 de `spec/SKILL.md`, los umbrales del control de tamaño, o `spec-impl/SKILL.md`.
- El texto nuevo o el diff, en concreto. No "mejorar las preguntas de datos": la pregunta que se agrega.
- El origen al final del texto nuevo: `(retro AAAA-MM-DD: 20261002-foo, 20261009-bar)`.

Para `spec-impl` como causa, el cambio va a `spec-impl/SKILL.md`, no a la spec ni al template.

Si una causa `fase2:nueva` se repite, propón la categoría de preguntas que falta.

Muestra todas las propuestas numeradas. **Cero propuestas es un resultado válido** y frecuente: dilo en una línea, sin buscar algo que proponer.

Las propuestas se quedan en el chat: aplicarlas es decisión y trabajo del dev, en la fuente de las skills o en el archivo de memoria del proyecto. Las que no aplique no se guardan en ningún lado: si su causa vuelve a aparecer, la próxima retro la propondrá con más evidencia, y eso es lo correcto.

## Fase 4 — Marcar

1. Pregunta si marcas como revisadas las specs leídas en la Fase 1. Con confirmación, en cada una —haya generado propuestas o no— cambia `> Retro: pendiente` por `> Retro: AAAA-MM-DD` con la fecha de hoy. Esa línea y nada más.
2. Cierra con: cuántas specs se marcaron y cuántas propuestas quedaron para el dev.
3. **No hagas commit** ni propongas qué stagear.

## Reglas duras

- **Nunca cambies de una spec otra cosa que su línea `> Retro:`.** Ni las entradas, ni las causas (si una está mal, dilo en el reporte), ni el cuerpo.
- **Nunca propongas un cambio sin entradas que lo respalden**, ni por debajo del umbral de 2 specs. La retro no es una revisión libre de las skills.
- **Nunca edites las skills** (ni esta ni sus hermanas), aunque el dev lo pida de pasada: recomienda el cambio y deja que lo aplique en la fuente. Si insiste, dile dónde editar y por qué una edición en la copia instalada se pierde al actualizar.
- **Nunca escribas en las specs sin confirmación.**
- **Nunca identifiques specs por número.** Siempre por su ID (nombre de archivo).
- **Nunca leas cuerpos enteros de specs en lote.** Solo la sección Desviaciones.
