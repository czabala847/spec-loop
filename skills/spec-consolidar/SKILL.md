---
name: spec-consolidar
description: 'Consolida las specs vigentes de un área en el doc vigente que ya tiene. Lee solo lo que `/spec` leería de cada spec (Decisiones y Fuera de alcance), lo compara con el doc y propone, con confirmación, las líneas que le faltan al doc y la marca `Consolidada en` de las specs que quedan cubiertas. De paso señala reemplazos mal marcados y áreas mal asignadas. Úsala cuando `/spec-impl` o `/spec-areas` avisen que un área con doc tiene 5 o más specs vigentes.'
disable-model-invocation: true
argument-hint: '[área]'
---

# /spec-consolidar — Pasar al doc lo que las specs de un área siguen decidiendo

`/spec` lee el doc vigente de un área y, como mucho, 4 de sus specs vigentes, de la más nueva a la más vieja. Una spec deja de ser vigente cuando otra la reemplaza entera o cuando se marca `Consolidada en: <doc>`. Si el área ya tiene doc, nada más en el flujo propone esa marca. Por eso la fila del área en `specs/INDEX.md` solo crece: las 4 specs que se leen repiten lo que el doc ya dice, y las decisiones de la quinta en adelante dejan de leerse sin que nadie se entere. Esta skill revisa la fila contra el doc para que las specs vigentes sean solo las que tienen algo que el doc no dice.

Las áreas **sin** doc no son de esta skill. Para esas, el doc nuevo lo propone `/spec-impl` al cerrar (`../spec-impl/references/doc-nuevo.md`, relativo al directorio de esta skill).

**Aquí no se escribe código de la aplicación.** Lo único que esta skill toca, siempre con confirmación, es:

- El doc vigente del área: las líneas que le faltan para cubrir una spec.
- El header de cada spec: `Consolidada en`, y `Supera a` / `Superada por` cuando un reemplazo está mal marcado. Nada más del header (ni `Área` ni `Estado`) y nada del cuerpo.

`specs/INDEX.md` es un archivo generado: se regenera con el script, nunca se edita a mano.

Responde en el idioma del repo (el de las specs existentes).

**Lectura y búsqueda.** Para leer, listar o buscar texto en archivos, en este orden:

1. **Las herramientas nativas de tu agente** (leer archivo, buscar texto, buscar archivos; p. ej. Read, Grep y Glob en Claude Code). Si las tienes, úsalas siempre.
2. **Si tu agente no tiene búsqueda nativa**, un solo `git grep` con el patrón de abajo: `git grep --untracked -n -E '<patrón>' -- ':(glob)specs/[0-9]*.md'` (`-l` en vez de `-n` si solo necesitas los nombres de archivo). Siempre con comillas simples: son literales en Bash, zsh y PowerShell, y las dobles alteran los backticks del patrón; si tu shell trata distinto las comillas simples, adapta el escape, no el patrón. Así se escribe igual en todas, y ya deja fuera `README.md`, `INDEX.md` y `archive/`. **Código de salida 1 sin salida significa 0 coincidencias, no un error:** no reintentes con otro patrón.
3. Nunca `cat`, `ls`, `grep`, `find`, `Select-String` ni `Get-Content` sueltos. Y estas búsquedas (specs, campos del header, secciones) las haces tú, en una sola llamada: **no las delegues a un subagente**. Su resultado ya es corto, así que delegar no ahorra contexto; solo suma tiempo, y el subagente no hereda estas reglas.

- **Specs del repo:** archivos del primer nivel de `specs/` cuyo nombre empieza con dígito (`AAAAMMDD-slug.md` o legacy `NN-slug.md`). Descarta `README.md`, `INDEX.md` y cualquier resultado bajo `specs/archive/`.
- **Campos del header** (`Estado`, `Área`, `Objetivo`…): un solo patrón para cualquier campo, cambiando la etiqueta: `^>?[[:space:]]*\*\*(.*\*\*)?(<etiqueta>):\*\*`. Por ejemplo, `^>?[[:space:]]*\*\*(.*\*\*)?(Estado|Status):\*\*`. Tolera el `> ` del blockquote, encuentra el campo esté al inicio o en medio de la línea y no atrapa menciones del campo en el cuerpo. Una sola búsqueda devuelve archivo y valor de todas a la vez. Si alguna spec no aparece (usa otro idioma en la etiqueta), lee solo sus primeras 8 líneas.
- **Secciones:** ubica `^## ` en el archivo y lee solo el rango de líneas que necesitas.

## Fase 1 — Elegir el área

1. El archivo de memoria del proyecto, si existe: el primero de `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`. Si tu agente ya lo cargó al iniciar la sesión, no lo releas. Ahí están las reglas del repo sobre comandos y docs.
2. Si `specs/INDEX.md` no existe, dilo y detente: sin índice no hay fila de vigentes que revisar (lo genera `/spec-impl` al cerrar o `/spec-areas`).
3. **Con argumento:** saca solo la fila de esa área con una búsqueda de `^\| <área> \|` en `specs/INDEX.md` (con `git grep`, la ruta es `-- specs/INDEX.md`). Nunca leas `INDEX.md` entero.
4. **Sin argumento:** busca `^\| ` en `specs/INDEX.md`, quédate con las filas de la tabla "Specs vigentes por área" (las que tienen 5 columnas) y lista las áreas con doc vigente y 5 o más specs vigentes, de la que más tiene a la que menos: `N. <área> — <doc> — M vigentes`. Si no hay ninguna, dilo en una línea y detente. Si hay, pregunta cuál revisas y espera respuesta.
5. Si el área elegida tiene `—` como doc vigente, dilo y remite a `/spec-impl`. Si tiene 4 o menos vigentes, dilo: `/spec` ya las lee todas, y consolidar ahí solo sirve para quitar repetición. Pregunta si sigue igual.

**Una sola área por corrida.** Revisar una fila de 12 specs ya cuesta varios cientos de líneas de lectura; dos áreas a la vez agotan el contexto antes de proponer nada.

## Fase 2 — Leer lo que `/spec` leería

Esta skill lee lo mismo que leería `/spec` (Fase 1, paso 5), pero de todas las vigentes y no solo de 4. Así el veredicto mide justo lo que se perdería.

1. **Las specs vigentes de la fila**, incluidas las marcadas `(parcial → X)`. Las "Reemplazadas enteras" y las ya "Consolidadas en un doc" no se leen.
2. **De cada spec, solo:** el header, la sección **Decisiones tomadas y descartadas** y lo que quedó **fuera de alcance** (el bloque "Fuera de alcance" de `Alcance` y la sección final de lo que no entra). Ubica `^## ` y lee solo esos rangos. Nunca el plan, los criterios ni las desviaciones.
3. **Del doc vigente:** sus encabezados primero; después, solo las secciones que nombran a esas specs (busca sus slugs en el doc) o que tratan lo mismo que sus decisiones. No leas el doc entero si es largo.
4. Si una spec es `(parcial → X)`, lo que reemplazó X ya no sigue en pie: no hace falta en el doc. Lee el header de X solo si el texto del `Superada por` no dice qué parte se reemplazó.

## Fase 3 — Veredicto por spec

El criterio es el del campo `Consolidada en` en `template.md` (`../spec/template.md`, relativo al directorio de esta skill): una spec queda consolidada solo si **todo** lo que `/spec` leería de ella y sigue en pie está en el doc.

Muestra una tabla con todas las vigentes, de la más nueva a la más vieja:

```
| Spec | Veredicto | Lo que le falta al doc |
| --- | --- | --- |
| 20261014-reintentos-de-pago | ✅ Consolidable ya | — |
| 20260920-cobro-con-tarjeta | 🟡 Con 2 líneas | En §3: por qué no se reintenta un 4xx. Fuera de alcance pendiente: reintentos en suscripciones. |
| 20260901-pago-en-cuotas | ❌ Queda vigente | ~8 decisiones propias que pedirían una sección entera del doc. |
| 20260815-recibo-pdf | ⚠ Área mal asignada | Sus decisiones son de `notificaciones`, no de esta área. |
```

- **✅ Consolidable ya:** el doc ya tiene todo lo que sigue en pie.
- **🟡 Con N líneas:** consolidable si el doc gana unas pocas líneas. Di cuáles, en qué sección, y en una oración cada una. Si hacen falta más de ~5 líneas, o una sección nueva entera, es ❌: esa spec todavía aporta algo propio y conviene que se siga leyendo.
- **❌ Queda vigente:** con el motivo en una línea.
- **⚠ No es de consolidación.** Son problemas que aparecen al leer, y se reportan aunque no se consoliden:
  - **Reemplazo mal marcado:** una spec vigente cuyo contenido ya no describe nada (otra spec borró o rehízo todo lo que decidía), o un `parcial` que en realidad fue total. Propón el `Superada por` correcto y su par `Supera a` en la otra spec.
  - **Área mal asignada:** las decisiones son de otra área. No la cambies: remite a `/spec-areas`.
  - **El doc contradice a la spec:** dilo. No consolides esa spec hasta que el dev diga cuál de los dos está al día (si hace falta, el código decide).

Debajo, una línea con el resultado: `La fila de <área> baja de N a M vigentes; hacen falta K líneas en <doc> y L correcciones de reemplazo.` Si casi ninguna es ✅ o 🟡, también es un resultado válido: dilo en una línea, sin forzar consolidaciones.

## Fase 4 — Escribir con confirmación

Propón todo en **una sola lista numerada**, con una sola pregunta al final:

> 1. A `<doc>` §N: [la línea, tal como quedaría escrita]. Cubre: <spec>.
> 2. `Consolidada en: <doc>` en: <spec>, <spec>, <spec>.
> 3. Reemplazo: `Superada por: <ID>` en <spec> y `Supera a: <spec>` en <ID>.
>
> ¿Entran? (todas / los números / ninguna)

- **Las líneas del doc** se escriben como el doc ya está escrito: cómo funciona hoy y por qué no de la forma obvia, no la historia de cómo se llegó. Pueden citar la spec de origen como lo haga el doc, y si no lo hace, como `(spec <ID>)`.
- **Una spec 🟡 solo se marca si entran sus líneas.** Si el dev rechaza una línea, la spec que dependía de ella queda vigente: dilo al escribir.
- **`Consolidada en`** va en la línea de `Supera a` / `Superada por` del header, con la ruta del doc vigente del área tal como figura en la tabla de áreas de `specs/README.md`. Respeta los finales de línea que ya tenga el archivo (CRLF o LF).

Después de escribir, corre `node <ruta-de-la-skill-spec>/scripts/specs-index.mjs` (la skill `spec` es hermana de esta: `../spec/scripts/specs-index.mjs`, relativo a este directorio) desde la raíz del repo, salvo que el archivo de memoria del proyecto lo reserve al dev; en ese caso, dile qué comando correr y qué esperar. En la salida no debe haber `⚠ doc inexistente` ni `⚠ referencia desconocida` en las specs que tocaste. Muestra la fila nueva del área.

## Cierre

- Cuántas specs se consolidaron, cuántas quedaron vigentes y cuántas líneas entraron al doc.
- Los ⚠ que quedaron para otra skill (áreas mal asignadas → `/spec-areas`).
- **No hagas commit** ni propongas qué stagear.

## Reglas duras

- **Nunca marques una spec sin que todo lo que sigue en pie esté en el doc.** Marcarla igual saca de `/spec` una decisión que nadie más tiene escrita, y nada avisa.
- **Nunca escribas sin confirmación**: ni el doc, ni los headers.
- **De una spec, solo su header** (`Consolidada en`, `Supera a` / `Superada por`). Nunca su cuerpo, su `Área` ni su `Estado`.
- **Nunca leas specs enteras.** Header, Decisiones y Fuera de alcance; nada más.
- **Una sola área por corrida.**
