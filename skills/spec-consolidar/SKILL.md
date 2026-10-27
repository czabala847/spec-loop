---
name: spec-consolidar
description: 'Consolida las specs vigentes de un área en su doc vigente, y deja ese doc al día con el código. Primero valida el doc contra el código (lo que nombra y ya no existe, lo que describe distinto) y lo poda de lo que el código ya dice o es historia, dentro de un tope de tamaño. Si el área no tiene doc, decide con cuatro filtros si le hace falta uno (o una sección de un doc existente) y, solo si pasa, escribe un borrador validado contra el código. Después lee solo lo que `/spec` leería de cada spec (Decisiones y Fuera de alcance), lo compara con el doc y propone, con confirmación, las líneas que faltan y la marca `Consolidada en` de las specs cubiertas. De paso señala reemplazos mal marcados y áreas mal asignadas. Úsala cuando `/spec-impl` o `/spec-areas` avisen que un área tiene 5 o más specs vigentes, tenga doc o no, o cuando el doc de un área ya no se parezca al código.'
disable-model-invocation: true
argument-hint: '[área]'
---

# /spec-consolidar — Pasar al doc lo que las specs de un área siguen decidiendo

`/spec` lee el doc vigente de un área y, como mucho, 4 de sus specs vigentes, de la más nueva a la más vieja. Una spec deja de ser vigente cuando otra la reemplaza entera o cuando se marca `Consolidada en: <doc>`. Si el área ya tiene doc, nada más en el flujo propone esa marca. Por eso la fila del área en `specs/INDEX.md` solo crece: las 4 specs que se leen repiten lo que el doc ya dice, y las decisiones de la quinta en adelante dejan de leerse sin que nadie se entere. Esta skill revisa la fila contra el doc para que las specs vigentes sean solo las que tienen algo que el doc no dice.

Marcar una spec `Consolidada en` le dice a `/spec` que confíe en el doc en vez de en la spec. Eso solo mejora el contexto si el doc es creíble. Por eso, antes de consolidar, esta skill pone el doc al día: **la fuente de la verdad es el código**. El doc dice cómo funciona hoy el área y por qué no de la forma obvia; no es un historial de specs ni una copia del código. Un doc que nombra archivos que ya no existen, o que crece con cada spec, termina igual que la fila de specs que vino a reemplazar.

Si el área **no** tiene doc, esta skill decide si le hace falta uno con el criterio de `doc-nuevo.md` (`../spec/references/doc-nuevo.md`, relativo al directorio de esta skill). Lo normal es que no: un doc nuevo solo se propone si pasa sus cuatro filtros, y antes que un archivo nuevo se prefiere asignar un doc existente o una sección de uno.

**Aquí no se escribe código de la aplicación.** Lo único que esta skill toca, siempre con confirmación, es:

- El doc vigente del área: las correcciones para que coincida con el código, la poda de lo que sobra y las líneas que le faltan para cubrir una spec. Si el área no tenía doc, el doc nuevo (o la sección nueva de un doc existente).
- La celda "Doc vigente" del área en la tabla de áreas de `specs/README.md`, solo cuando el área no tenía doc.
- Las referencias `§N` a ese doc (en `specs/README.md`, en las specs y en el archivo de memoria del proyecto), solo si una sección cambia de número o desaparece.
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

1. El archivo de memoria del proyecto, si existe: el primero de `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`. Si tu agente ya lo cargó al iniciar la sesión, no lo releas. Ahí están las reglas del repo sobre comandos y docs, y el tope de líneas de un doc si el repo declara uno.
2. Si `specs/INDEX.md` no existe, dilo y detente: sin índice no hay fila de vigentes que revisar (lo genera `/spec-impl` al cerrar o `/spec-areas`).
3. **Con argumento:** saca solo la fila de esa área con una búsqueda de `^\| <área> \|` en `specs/INDEX.md` (con `git grep`, la ruta es `-- specs/INDEX.md`). Nunca leas `INDEX.md` entero.
4. **Sin argumento:** busca `^\| ` en `specs/INDEX.md`, quédate con las filas de la tabla "Specs vigentes por área" (las que tienen 5 columnas) y lista las áreas con 5 o más specs vigentes, tengan doc o no, de la que más tiene a la que menos: `N. <área> — <doc o "sin doc"> — M vigentes`. Si no hay ninguna, dilo en una línea y detente. Si hay, pregunta cuál revisas y espera respuesta.
5. Si el área elegida tiene `—` como doc vigente, sigue en el **modo doc nuevo**: aplica los filtros 1 a 3 de `doc-nuevo.md` (el 4 se mide en la Fase 4). Si un doc existente ya cubre el área, propón asignárselo y sigue con ese doc como si siempre lo hubiera tenido. Si no pasa un filtro, dilo con el filtro que falló y detente. Si pasa, di qué motivo del filtro 1 cumple y la ruta que propones, y sigue.
6. Si el área tiene doc y 4 o menos vigentes, dilo: `/spec` ya las lee todas, y consolidar ahí solo sirve para quitar repetición. Pregunta si sigue igual.

**Una sola área por corrida.** Revisar una fila de 12 specs ya cuesta varios cientos de líneas de lectura; dos áreas a la vez agotan el contexto antes de proponer nada.

## Fase 2 — Poner el doc al día con el código

Aquí sí se lee el doc vigente **entero**: validarlo y podarlo exige verlo todo. Por eso es una sola área por corrida.

**En el modo doc nuevo** no hay doc que leer: se escribe un borrador y es ese borrador el que pasa por 2.1 y 2.2. Primero haz la Fase 3 (lo que leería `/spec` de las vigentes de la fila); después ubica con búsqueda de texto los puntos de entrada del área en el código (rutas de la app, acciones, servicios) y lee solo esos fragmentos. Con eso, escribe lo que pide `doc-nuevo.md` ("Qué lleva"). En 2.1, el nivel 2 se aplica a todo el borrador: cada regla que escribiste tiene que verse en el código. El borrador no se muestra todavía: se muestra en la Fase 5.

### 2.1 Validar contra el código

Gana el código en lo que el código muestra. Dos niveles, del barato al caro:

1. **Lo que el doc nombra, en todo el doc.** Saca del doc los nombres concretos: rutas de archivo, símbolos (funciones, hooks, tipos, constantes), rutas de la app, variables de entorno, comandos. Búscalos en el repo con la búsqueda de texto de tu agente (o `git grep -n -F '<nombre>'`, sin limitar a `specs/`), agrupando varios nombres por búsqueda. Los que no aparecen están desactualizados: ubica qué los reemplazó (busca el comportamiento, no el nombre) y propón la corrección. Si no encuentras reemplazo, propón quitar esa parte y dilo.
2. **Lo que el doc describe, solo donde hace falta.** El comportamiento (flujos, reglas, códigos de error, redirecciones) se compara con el código solo en las secciones que tocan las specs vigentes de la fila y en las que el punto 1 encontró algo roto. Lee los puntos de entrada con búsqueda de texto, nunca módulos enteros. Si el doc y el código no coinciden, propón reescribir esa parte como funciona hoy. Si no puedes decidir si el código está bien (puede ser un bug), no corrijas: pregúntalo.

**El código solo puede contradecir lo que muestra.** Lo que depende de un sistema externo (p. ej. un backend, un servicio de terceros, la configuración de un proveedor) no aparece en el repo, y que no aparezca no prueba que sea falso. Un hecho así no se corrige ni se quita por no encontrarlo: se queda, y el reporte lo marca "no verificable desde el código". Solo se corrige si el código lo contradice de frente (p. ej. el doc dice que el servicio revoca el token y el código reusa el viejo a propósito), y en ese caso se pregunta, porque cualquiera de los dos puede estar mal.

Lo que no verificaste no se marca como verificado: si una sección quedó fuera de los dos niveles, el reporte lo dice.

### 2.2 Podar

Un doc es caro: `/spec` lo lee antes de cada spec del área. Se queda solo con lo que el código no puede decir. Es el mismo filtro de `/spec-impl` 5.2 (`../spec-impl/SKILL.md`, primera pregunta: "¿un agente lo deduciría leyendo el código?"), aplicado al doc entero:

| Sale (o se reduce) | Queda |
| --- | --- |
| Snippets de código: queda la regla y su porqué | Los porqués: por qué así y no de la forma obvia |
| Diagramas que el código ya cuenta: pasan a una línea de flujo (`A → B → C`) | Las trampas: lo que rompe en silencio si no se sabe |
| Rutas de archivo y nombres de helpers internos, salvo los puntos de entrada del área | Las decisiones descartadas que siguen en pie |
| Lo histórico: renombres, "antes de la spec X", cómo era antes | Lo pendiente que una spec futura puede retomar |
| Citas de specs repetidas en cada párrafo: una por sección alcanza | Recetas que no se deducen (p. ej. cómo reproducir un estado en dev) |
| Tablas con columnas que repiten el código (p. ej. "dónde se lee" una variable) | Los hechos de un sistema externo, con su fecha de verificación, y los supuestos sin verificar, marcados como tales |
| | Lo que se agregue en esta corrida para consolidar |

La fecha de una verificación no es historia: dice cuándo se comprobó algo que el código no muestra, y es lo que permite saber si conviene volver a comprobarlo.

**Tope de tamaño:** el que declare el archivo de memoria del proyecto o, si no declara ninguno, **~500 líneas** por doc. Si el doc ya lo pasa, o lo pasaría con las líneas de la Fase 4, la poda deja de ser opcional: propón también qué condensar dentro de lo que queda.

Al podar:

- **Nunca saques lo que sostiene a una spec ya `Consolidada en` este doc.** Si una poda lo tocaría, esa parte se condensa, no se borra.
- **Mantén la numeración de secciones.** Si una sección desaparece o se funde con otra, busca las referencias `<doc> §N` (en `specs/README.md`, en las specs y en el archivo de memoria) y propón actualizarlas en la misma lista.
- Respeta los finales de línea que ya tenga el doc (CRLF o LF).

## Fase 3 — Leer lo que `/spec` leería

Esta skill lee lo mismo que leería `/spec` (Fase 1, paso 5), pero de todas las vigentes y no solo de 4. Así el veredicto mide justo lo que se perdería.

1. **Las specs vigentes de la fila**, incluidas las marcadas `(parcial → X)`. Las "Reemplazadas enteras" y las ya "Consolidadas en un doc" no se leen.
2. **De cada spec, solo:** el header, la sección **Decisiones tomadas y descartadas** y lo que quedó **fuera de alcance** (el bloque "Fuera de alcance" de `Alcance` y la sección final de lo que no entra). Ubica `^## ` y lee solo esos rangos. Nunca el plan, los criterios ni las desviaciones.
3. Si una spec es `(parcial → X)`, lo que reemplazó X ya no sigue en pie: no hace falta en el doc. Lee el header de X solo si el texto del `Superada por` no dice qué parte se reemplazó.
4. **"Sigue en pie" lo decide el código.** Si una decisión de una spec ya no se ve en el código (lo que decidía fue borrado o rehecho), no se pasa al doc: es un posible reemplazo mal marcado (Fase 4, ⚠). La excepción es la de 2.1: una decisión sobre un sistema externo no se ve en el código, y eso no la hace un reemplazo mal marcado.

## Fase 4 — Veredicto por spec

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
  - **El doc contradice a la spec:** decide el código. Si el código le da la razón al doc, lo de la spec ya no sigue en pie (posible reemplazo mal marcado); si se la da a la spec, el doc se corrige en la Fase 5. Si el código no lo deja claro, no consolides esa spec y pregúntalo.

Debajo, una línea con el resultado: `La fila de <área> baja de N a M vigentes; hacen falta K líneas en <doc> y L correcciones de reemplazo.` Si casi ninguna es ✅ o 🟡, también es un resultado válido: dilo en una línea, sin forzar consolidaciones.

**En el modo doc nuevo**, el veredicto es contra el borrador, y aquí se mide el filtro 4 de `doc-nuevo.md`. Si el área entró por acumular y la fila no baja de 5 vigentes, propón **no crear el doc**: dilo en una línea con los números, y ofrece en su lugar solo los ⚠. Un área transversal no pasa por este filtro.

## Fase 5 — Escribir con confirmación

Propón todo en **una sola lista numerada**, agrupada en este orden, con una sola pregunta al final. El doc no se muestra entero: las correcciones y las podas van resumidas por sección; las líneas nuevas, tal como quedarían escritas.

> **Doc al día** (`<doc>`: N líneas → ~M)
> 1. §8: nombra `sign-out.action.ts`, que ya no existe; hoy cerrar sesión es [cómo]. Se reescribe el párrafo.
> 2. §3: sale el snippet de [archivo] y el diagrama de secuencia (queda una línea de flujo). −60 líneas.
> 3. §7.1 se funde en §7; se actualiza `<doc> §7.1` en `specs/README.md`.
>
> **Consolidación**
> 4. A `<doc>` §N: [la línea, tal como quedaría escrita]. Cubre: <spec>.
> 5. `Consolidada en: <doc>` en: <spec>, <spec>, <spec>.
> 6. Reemplazo: `Superada por: <ID>` en <spec> y `Supera a: <spec>` en <ID>.
>
> ¿Entran? (todas / los números / ninguna)

**En el modo doc nuevo**, el primer grupo es **Doc nuevo**: el borrador entero (es la única vez que el doc se muestra completo), con su ruta y el número de líneas, y debajo la celda "Doc vigente" que se llena en la tabla de áreas de `specs/README.md`. Si es una sección de un doc existente, la sección tal como quedaría y la celda con su `§N`. Después, el grupo **Consolidación** como siempre. Si el dev rechaza el doc, no se marca ninguna spec.

- **Las líneas del doc**, nuevas o reescritas, dicen cómo funciona hoy y por qué no de la forma obvia, no la historia de cómo se llegó. Pueden citar la spec de origen como lo haga el doc, y si no lo hace, como `(spec <ID>)`, una vez por sección.
- **Una spec 🟡 solo se marca si entran sus líneas.** Si el dev rechaza una línea, la spec que dependía de ella queda vigente: dilo al escribir.
- **`Consolidada en`** va en la línea de `Supera a` / `Superada por` del header, con la ruta del doc vigente del área tal como figura en la tabla de áreas de `specs/README.md`. Respeta los finales de línea que ya tenga el archivo (CRLF o LF).

Después de escribir, corre `node <ruta-de-la-skill-spec>/scripts/specs-index.mjs` (la skill `spec` es hermana de esta: `../spec/scripts/specs-index.mjs`, relativo a este directorio) desde la raíz del repo, salvo que el archivo de memoria del proyecto lo reserve al dev; en ese caso, dile qué comando correr y qué esperar. En la salida no debe haber `⚠ doc inexistente` ni `⚠ referencia desconocida` en las specs que tocaste. Muestra la fila nueva del área.

## Cierre

- El doc: cuántas líneas tenía y cuántas tiene (o, si es nuevo, su ruta y sus líneas), cuántas correcciones contra el código entraron, y qué secciones conviene que el dev relea (las más condensadas, las que no se verificaron contra el código y las marcadas "no verificable desde el código").
- Cuántas specs se consolidaron y cuántas quedaron vigentes.
- Los ⚠ que quedaron para otra skill (áreas mal asignadas → `/spec-areas`).
- **No hagas commit** ni propongas qué stagear.

## Reglas duras

- **Nunca marques una spec sin que todo lo que sigue en pie esté en el doc.** Marcarla igual saca de `/spec` una decisión que nadie más tiene escrita, y nada avisa.
- **Gana el código en lo que el código muestra.** Nada entra al doc ni se queda en él si el código dice otra cosa. Si no está claro si el código está bien, se pregunta; no se corrige el doc a ciegas. Lo de un sistema externo no se borra por no aparecer en el código.
- **Un doc nuevo solo si pasa los cuatro filtros** de `doc-nuevo.md`. Antes que un archivo nuevo, un doc existente o una sección de uno.
- **El doc no es un historial.** Cómo funciona hoy y por qué; nunca cómo era antes, ni lo que el código ya dice solo.
- **Nunca escribas sin confirmación**: ni el doc, ni los headers.
- **De una spec, solo su header** (`Consolidada en`, `Supera a` / `Superada por`). Nunca su cuerpo, su `Área` ni su `Estado`.
- **Nunca leas specs enteras.** Header, Decisiones y Fuera de alcance; nada más. El doc sí se lee entero; el código, solo los fragmentos que hace falta comparar.
- **Una sola área por corrida.**
