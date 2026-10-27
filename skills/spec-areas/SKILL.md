---
name: spec-areas
description: 'Adopta o reorganiza las áreas de las specs. En un repo que ya tiene specs sin el campo `Área`, propone un vocabulario cerrado de áreas a partir de las specs existentes, asigna 1 a 3 áreas a cada una y las escribe en sus headers, todo con confirmación. En un repo que ya las usa, detecta áreas desconocidas, sin uso, sinónimos y specs sin área, y propone la corrección. Úsala una vez al adoptar /spec en un repo existente, o cuando el índice por área empiece a mentir.'
disable-model-invocation: true
argument-hint: '[sin argumentos]'
---

# /spec-areas — Adoptar o reorganizar las áreas de las specs

Las specs se nombran por fecha, pero se buscan por tema. El campo `Área` del header es lo que permite que `/spec` lea las specs vigentes del tema de un pedido en vez de "las más recientes", y que el script `specs-index.mjs` de la skill `spec` arme la tabla "Specs vigentes por área" en `specs/INDEX.md`. Esta skill deja un repo en ese estado y lo mantiene coherente.

**Aquí no se escribe código de la aplicación ni se cambia el contenido de ninguna spec.** Lo único que esta skill toca es:

- El campo `**Área:**` del header de cada spec. Nada más del header y nada del cuerpo.
- La tabla de áreas de `specs/README.md`.

El índice no se instala: el script vive en la skill `spec` (`../spec/scripts/specs-index.mjs`, relativo al directorio de esta skill), se corre con `node` desde la raíz del repo, crea `specs/README.md` desde la plantilla si no existe (o le agrega la tabla de áreas si le falta) y escribe entero `specs/INDEX.md`, que es un archivo generado: nunca se edita a mano.

Responde en el idioma del repo (el de las specs existentes).

**Lectura y búsqueda.** Para leer, listar o buscar texto en archivos, en este orden:

1. **Las herramientas nativas de tu agente** (leer archivo, buscar texto, buscar archivos; p. ej. Read, Grep y Glob en Claude Code). Si las tienes, úsalas siempre.
2. **Si tu agente no tiene búsqueda nativa**, un solo `git grep` con el patrón de abajo: `git grep --untracked -n -E '<patrón>' -- ':(glob)specs/[0-9]*.md'` (`-l` en vez de `-n` si solo necesitas los nombres de archivo). Siempre con comillas simples: son literales en Bash, zsh y PowerShell, y las dobles alteran los backticks del patrón; si tu shell trata distinto las comillas simples, adapta el escape, no el patrón. Así se escribe igual en todas, y ya deja fuera `README.md`, `INDEX.md` y `archive/`. **Código de salida 1 sin salida significa 0 coincidencias, no un error:** no reintentes con otro patrón.
3. Nunca `cat`, `ls`, `grep`, `find`, `Select-String` ni `Get-Content` sueltos. Y estas búsquedas (specs, campos del header, secciones) las haces tú, en una sola llamada: **no las delegues a un subagente**. Su resultado ya es corto, así que delegar no ahorra contexto; solo suma tiempo, y el subagente no hereda estas reglas.

- **Specs del repo:** archivos del primer nivel de `specs/` cuyo nombre empieza con dígito (`AAAAMMDD-slug.md` o legacy `NN-slug.md`). Descarta `README.md`, `INDEX.md` y cualquier resultado bajo `specs/archive/`.
- **Campos del header** (`Estado`, `Área`, `Objetivo`…): un solo patrón para cualquier campo, cambiando la etiqueta: `^>?[[:space:]]*\*\*(.*\*\*)?(<etiqueta>):\*\*`. Por ejemplo, `^>?[[:space:]]*\*\*(.*\*\*)?(Estado|Status):\*\*`. Tolera el `> ` del blockquote, encuentra el campo esté al inicio o en medio de la línea y no atrapa menciones del campo en el cuerpo. Una sola búsqueda devuelve archivo y valor de todas a la vez. Si alguna spec no aparece (usa otro idioma en la etiqueta), lee solo sus primeras 8 líneas.
- **Secciones:** ubica `^## ` en el archivo y lee solo el rango de líneas que necesitas.

## Fase 1 — Diagnóstico

Lee, sin escribir nada:

1. El archivo de memoria del proyecto, si existe: el primero de `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`. Si tu agente ya lo cargó al iniciar la sesión, no lo releas. Ahí están las reglas del repo sobre comandos y commits, y los punteros a sus docs. Si no existe ninguno, no lo busques en otro lado: cuando necesites una regla (p. ej. si puedes correr un comando), pregúntasela al dev.
2. `specs/README.md`, si existe: el vocabulario de áreas, si lo tiene.
3. **Solo el header de cada spec**: el título y las primeras líneas hasta el `Objetivo`. Sácalos con dos búsquedas sobre la carpeta, por la vía del bloque de arriba, no abriendo spec por spec: `^# ` para los títulos y el patrón de campos con `(Área|Area|Objetivo|Objective)`. Si de una spec no sale el `Objetivo`, lee solo sus primeras 8 líneas. No leas cuerpos enteros. Con 40+ specs, leer cuerpos agota el contexto antes de llegar a proponer nada. El título y el objetivo alcanzan para asignar un área. Si uno es ambiguo, lee solo la sección "Alcance" de esa spec.
4. Los encabezados (`#`, `##`) de los docs del proyecto, para proponer el "Doc vigente" de cada área. Son los que nombra el archivo de memoria; si no nombra ninguno, busca una carpeta de documentación en el repo (`docs/`, `doc/`…). Si no hay docs, la columna queda en `—`.

Muestra el diagnóstico en una tabla corta y di qué modo corresponde:

```
| Pieza | Estado |
| --- | --- |
| specs/README.md | ✅ / ❌ no existe (lo crea el script en la Fase 4) |
| Vocabulario de áreas | ✅ N áreas / ❌ no existe |
| Specs con `Área` | 12 de 47 |
```

- **Modo adopción**: no hay vocabulario, o la mayoría de las specs no tienen `Área`. Sigue con las Fases 2 a 4 completas.
- **Modo revisión**: ya hay vocabulario y casi todas las specs tienen `Área`. Salta a la Fase 2, modo revisión.

Si `specs/README.md` ya tiene una tabla de índice escrita a mano fuera de los marcadores, dilo en el diagnóstico: el script no la borra, pero queda duplicada con `INDEX.md`. Pregunta si se elimina. Si tiene los bloques generados de una versión anterior (`specs-by-area`, `specs-index`), el script los quita al correr y avisa; quedan sus títulos, y propones borrarlos.

## Fase 2 — El vocabulario

### Modo adopción: proponerlo

A partir de los títulos y objetivos, propón entre 5 y 12 áreas. Reglas para que el vocabulario sirva:

- **Un área es un comportamiento del producto que una spec futura va a volver a tocar**, no un módulo de código ni una capa. `facturacion`, `notificaciones` y `login` sí. `components`, `refactor` y `backend` no.
- **Un nombre por concepto**, en minúsculas, en el idioma del repo, preferiblemente una palabra. Nada de sinónimos (`factura` vs `facturacion`), porque parten el área en dos y cada mitad esconde a la otra.
- **Tamaño**: un área con más de ~15 specs es demasiado amplia (propón dividirla). Un área con 1 spec que ninguna futura va a tocar sobra (fúndela en otra).
- **Doc vigente**: el doc del proyecto (y la sección, si aplica: `docs/<tema>.md §6`) que describe cómo funciona hoy esa área. `—` si ninguno lo hace. No lo inventes: se basa en los encabezados que leíste en la Fase 1.

Muéstralo como la tabla que se va a escribir:

```markdown
| Área | Qué cubre | Doc vigente |
| --- | --- | --- |
| facturacion | Emisión de facturas, numeración fiscal, notas de crédito | docs/<tema>.md §3 |
| notificaciones | Correos y avisos al usuario, plantillas, preferencias | — |
```

Pregunta: "¿El vocabulario queda así o lo ajustamos?" Itera hasta que el usuario lo confirme. **No sigas a la Fase 3 sin vocabulario confirmado**: asignar áreas sobre un vocabulario que después cambia es hacer el trabajo dos veces.

### Modo revisión: auditarlo

Con el vocabulario existente y los headers, reporta solo lo que encuentres:

- Specs sin `Área`, o con un área que no está en la tabla.
- Áreas de la tabla que ninguna spec usa.
- Áreas con más de ~15 specs vigentes (candidatas a dividir) o pares de áreas que siempre aparecen juntas (candidatas a fundir).
- Áreas con `—` como doc vigente y 5 o más specs vigentes: ahí `/spec` está reconstruyendo el estado actual desde la historia, y un doc lo resolvería. Solo dilo: el doc lo propone `/spec-impl` la próxima vez que una spec cierre en esa área.
- Áreas **con** doc vigente y 5 o más specs vigentes: las más viejas ya no llegan a `/spec`, y las más nuevas suelen repetir lo que el doc ya dice. Solo dilo: las revisa contra el doc `/spec-consolidar <área>`.
- Reemplazos mal marcados: una spec cuyo `Supera a` dice "parcial" y la otra spec, en `Superada por`, no lo dice (o al revés). El índice usa la palabra `parcial` para decidir qué sigue vigente.
- Referencias rotas: filas con `⚠ referencia desconocida` en `specs/INDEX.md` (un `Superada por` que apunta a un ID que no existe, p. ej. una spec que se renombró), y avisos `⚠ slug repetido` del script (dos specs con el mismo slug y distinta fecha: a veces la misma feature escrita dos veces).

Propón cada corrección y espera confirmación. Si no hay nada, dilo en una línea. Las correcciones confirmadas se escriben como en la Fase 4.

## Fase 3 — Asignar áreas a las specs

Propón una tabla con **todas** las specs que faltan, incluidas las `Obsoleto` y las `Borrador`:

```
| Spec | Título | Área propuesta |
| --- | --- | --- |
| 20260901-factura-electronica | Las facturas se emiten electrónicamente | facturacion |
| 20261014-aviso-factura-emitida | El cliente recibe un correo al emitirse su factura | notificaciones, facturacion |
```

- **De 1 a 3 áreas por spec**: las que la spec **cambia**, no las que solo menciona. Una spec de notificaciones que lee la factura es `notificaciones`, no `notificaciones, facturacion`, salvo que cambie cómo se emite o se guarda la factura.
- Ordena las áreas de cada spec de la principal a la secundaria.
- Marca con `?` las asignaciones de las que no estás seguro y di por qué en una línea debajo de la tabla. Que el usuario revise esas, no las 47.

Pregunta: "¿Corrijo alguna antes de escribir?" Espera confirmación.

## Fase 4 — Escribir y regenerar

1. En cada spec, inserta `**Área:** <áreas> · ` justo después del valor de `**Rama:**` (o `**Branch:**`), en la misma línea del header. Si el header no tiene `Rama`, ponlo antes de `**Supera a:**` (o `**Supersedes:**`). Si tampoco hay, ponlo al final de la última línea de metadatos. No toques nada más del archivo. Respeta los finales de línea que ya tenga (CRLF o LF).
2. Si una spec ya tenía `Área` y el usuario confirmó otro valor, reemplaza solo el valor.
3. Si `specs/README.md` no existe o le falta la tabla de áreas, corre primero `node <ruta-de-la-skill-spec>/scripts/specs-index.mjs` desde la raíz del repo para que los cree. Después escribe la tabla de áreas confirmada entre `<!-- specs-areas:start -->` y `<!-- specs-areas:end -->`.
4. Corre `node <ruta-de-la-skill-spec>/scripts/specs-index.mjs`, salvo que el archivo de memoria del proyecto lo reserve al desarrollador. En ese caso, dile qué comando correr y qué esperar.
5. Revisa la salida. No debe haber filas `⚠ área desconocida` ni `⚠ header incompleto` por el campo `Área`. Muestra la tabla "Specs vigentes por área" resultante (en `specs/INDEX.md`) para que el usuario vea si el agrupamiento tiene sentido.

## Cierre

- Cuántas specs se actualizaron y cuántas áreas quedaron.
- Recordatorio: desde ahora `/spec` lee el contexto por área y `/spec-impl` valida el campo al cerrar.
- **No hagas commit** ni propongas qué stagear.

## Reglas duras

- **Nunca cambies nada de una spec que no sea su campo `Área`.** Ni el estado, ni `Supera a` / `Superada por` (en modo revisión se proponen esas correcciones, y las escribe el usuario o una confirmación explícita, una por una), ni el cuerpo.
- **Nunca escribas sin confirmación**: ni el vocabulario ni las asignaciones.
- **Nunca leas cuerpos enteros de specs en lote.** Header primero. El cuerpo solo para un caso ambiguo puntual.
- **El vocabulario es del repo, no de esta skill.** No traigas áreas de otro proyecto ni una lista genérica: sale de las specs que existen.
