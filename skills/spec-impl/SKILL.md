---
name: spec-impl
description: 'Implementa una spec Aprobada en su rama, paso a paso (o de corrido con `--auto`), y la cierra: criterios, memoria del proyecto, desviaciones y estado.'
disable-model-invocation: true
argument-hint: '[id-o-slug-de-la-spec] [--auto]'
allowed-tools: 'Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git diff:*), Bash(git grep:*), Bash(git ls-files:*)'
---

# /spec-impl — Implementador de specs aprobadas

## Contexto de la sesión

Antes de la Fase 1, toma este contexto (con los comandos o herramientas de tu agente):

- Estado del repositorio: `git status --short`.
- Rama actual: `git branch --show-current`.
- El archivo de memoria del proyecto, si existe: el primero de `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`. Si tu agente ya lo cargó al iniciar la sesión, no lo releas. De ahí salen las reglas que esta skill llama "del proyecto": qué comandos puedes correr, cuáles son solo del dev, cómo se verifica el proyecto, cómo obtener diagnósticos, dónde están los docs.

**Lectura y búsqueda.** Para leer, listar o buscar texto en archivos, en este orden:

1. **Las herramientas nativas de tu agente** (leer archivo, buscar texto, buscar archivos; p. ej. Read, Grep y Glob en Claude Code). Si las tienes, úsalas siempre.
2. **Si tu agente no tiene búsqueda nativa**, un solo `git grep` con el patrón de abajo: `git grep --untracked -n -E '<patrón>' -- ':(glob)specs/[0-9]*.md'` (`-l` en vez de `-n` si solo necesitas los nombres de archivo). Siempre con comillas simples: son literales en Bash, zsh y PowerShell, y las dobles alteran los backticks del patrón; si tu shell trata distinto las comillas simples, adapta el escape, no el patrón. Así se escribe igual en todas, y ya deja fuera `README.md`, `INDEX.md` y `archive/`. **Código de salida 1 sin salida significa 0 coincidencias, no un error:** no reintentes con otro patrón.
3. Nunca `cat`, `ls`, `grep`, `find`, `Select-String` ni `Get-Content` sueltos. Y estas búsquedas (specs, campos del header, secciones) las haces tú, en una sola llamada: **no las delegues a un subagente**. Su resultado ya es corto, así que delegar no ahorra contexto; solo suma tiempo, y el subagente no hereda estas reglas.

- **Specs del repo:** archivos del primer nivel de `specs/` cuyo nombre empieza con dígito (`AAAAMMDD-slug.md` o legacy `NN-slug.md`). Descarta `README.md`, `INDEX.md` y cualquier resultado bajo `specs/archive/`.
- **Campos del header** (`Estado`, `Área`, `Objetivo`…): un solo patrón para cualquier campo, cambiando la etiqueta: `^>?[[:space:]]*\*\*(.*\*\*)?(<etiqueta>):\*\*`. Por ejemplo, `^>?[[:space:]]*\*\*(.*\*\*)?(Estado|Status):\*\*`. Tolera el `> ` del blockquote, encuentra el campo esté al inicio o en medio de la línea y no atrapa menciones del campo en el cuerpo. Una sola búsqueda devuelve archivo y valor de todas a la vez. Si alguna spec no aparece (usa otro idioma en la etiqueta), lee solo sus primeras 8 líneas.
- **Secciones:** ubica `^## ` en el archivo y lee solo el rango de líneas que necesitas.

**Política de comandos**, en todas las fases:

- Un comando que el archivo de memoria reserva al dev **nunca lo corres**: lo anotas como pendiente para el dev.
- Un comando que el archivo de memoria permite (por ejemplo, en una sección de verificación), lo corres.
- Si el archivo de memoria no dice cómo se verifica el proyecto, deduce la herramienta del repo **solo cuando sea clara** (un único script de test en el gestor de paquetes, un `Makefile` con un target `test`, una herramienta de navegador de tu agente para una prueba visual). La primera vez que la uses, dilo en una línea. Si hay varias candidatas o ninguna es obvia, pregunta al dev antes de correr nada.
- Cualquier otro comando que no sea de solo lectura **lo preguntas antes**.

**Checkpoints**, en los dos modos (los comandos concretos salen siempre del archivo de memoria y de la política de arriba):

- **Por paso:** solo la verificación focalizada del paso. Si el paso no trae línea de verificación, corre los tests que el paso creó o tocó con el comando focalizado que indique el archivo de memoria; si no indica ninguno, el paso queda sin verificación.
- **Excepción:** si un paso cambia un contrato compartido y no obtuviste diagnósticos de sus consumidores, corre el chequeo estático completo del proyecto justo después de ese paso.
- **Al cierre (inicio de 5.1):** chequeo estático completo, lint y tests afectados, antes de marcar criterios. Los que el proyecto reserva al dev quedan pendientes para él.
- Nada de chequeos completos en los demás pasos: son lentos y su resultado se repite al cierre.

**Regla de preguntas**, en todas las fases:

- **Una pregunta por mensaje, y es lo último del mensaje.** Después de ella no va nada: ni el paso siguiente, ni otra propuesta. Así es lo primero que el dev ve, sin hacer scroll.
- Una pregunta puede aprobar una **lista numerada de un mismo paso** (el dev responde "todas", "1 y 3", "ninguna"). Nunca junta decisiones de pasos distintos.
- **Si no hay nada que decidir, no preguntes**: dilo en una línea y sigue. Lo que no requiere decisión se hace y se reporta.

---

## Instrucciones

Fases: 1 identificar la spec → 2 validar que esté Aprobada → 3 rama → 4 implementar → 5 cerrar.

Síguelas en orden estricto. **No avances a la siguiente fase si la anterior no se completó correctamente.** La última es la fase de cierre: una implementación que se detiene en el último paso del plan no está terminada, está abandonada a medias.

---

### Fase 1 — Identificar la spec

El argumento recibido es el texto con que se invocó la skill (en Claude Code: `$ARGUMENTS`).

Primero separa el flag `--auto`, que puede venir antes o después del nombre de la spec. Si está, la implementación corre en **modo `--auto`**; si no, en **modo normal**. Lo que queda después de quitar el flag es el nombre de la spec. Si solo vino `--auto`, trátalo como un argumento vacío.

Si la carpeta `specs/` no existe, dilo ("La carpeta specs/ no existe") y detente.

Si el nombre de la spec está vacío, busca las **pendientes** con **una sola búsqueda** (bloque **Lectura y búsqueda**) que ya filtra por estado, para no traer al contexto una línea por cada spec implementada:

```
^>?[[:space:]]*\*\*(.*\*\*)?(Estado|Status):\*\*[[:space:]]*(Borrador|En revisión|Aprobado|Draft|In review|Approved)
```

- Los valores salen de la línea `**Estados válidos:**` de `template.md` (en el directorio de la skill `/spec`): los que no son Implementado ni Obsoleto. Si el repo escribe sus specs en otro idioma, pon en el patrón los valores de esa línea traducidos como los use el repo.
- `INDEX.md` no sirve para esto (solo lista las Implementadas): no lo abras.
- **0 coincidencias** (código 1 sin salida en `git grep`) significa que no hay pendientes, no un error.
- Cada línea trae también el `Depende de` de esa spec. Una dependencia que aparece entre los resultados todavía no está implementada; una que no aparece está Implementada u Obsoleta. No hace falta otra búsqueda.
- Solo las de estado "Aprobado" (con el mismo criterio de la Fase 2) son implementables. Las de Borrador o En revisión salen en la misma búsqueda y solo se nombran.

- **Ninguna aprobada:** dilo en una línea. Si hay specs en Borrador o En revisión, agrega una línea con sus IDs: `En borrador / revisión: <ID>, <ID> — apruébalas a mano para implementarlas.` Detente.
- **Una sola aprobada:** tómala sin preguntar, dilo en una línea (`Única spec aprobada: <ID> — la tomo.`) y sigue a la Fase 2.
- **Dos o más aprobadas:** lístalas numeradas, de la más vieja a la más nueva, una por línea: `N. <ID> — <objetivo>`. El objetivo va en otra línea del header: sácalo con una búsqueda del campo `(Objetivo|Objective)` limitada a esos archivos. Si el `Depende de` de una nombra una spec que no está Implementada, agrega `(depende de <ID>, aún sin implementar)`. Debajo, la misma línea de borradores si los hay. Cierra con `¿Cuál implemento? (número o ID)`, detente y espera respuesta. El número de la lista vale igual que el ID o el slug.

Si tiene valor:

- Busca el archivo en `specs/` **por nombre**, sin buscar estados ni leer contenido: `specs/*<texto>*.md` con la búsqueda de archivos de tu agente o, si no la tiene, `git ls-files --cached --others --exclude-standard -- ':(glob)specs/[0-9]*<texto>*.md'`. El usuario puede haber escrito el ID completo (`20261014-reintentos-de-pago`, el nombre del archivo sin `.md`) o solo el slug (`reintentos-de-pago`). En un repo con specs legacy `NN-slug.md`, también solo el número (`07`). Intenta encontrar el archivo correcto en cualquiera de esos casos.
- Si el slug o el número coincide con **más de un archivo** (dos devs, o dos sesiones, usaron el mismo), no elijas: lístalos con su fecha y su objetivo, y pide el ID completo.
- Si no encuentras el archivo, muestra las pendientes (con la búsqueda filtrada de arriba) y pide al usuario que corrija el nombre.
- Si lo encuentras, continúa a la Fase 2.

---

### Fase 2 — Validar el estado de la spec

Lee la spec. Busca la línea de estado: está cerca del inicio y su etiqueta puede estar en cualquier idioma (`**Estado:**`, `**Status:**`…). Identifícala por su posición y su valor, no por la etiqueta exacta.

**Regla absoluta:** solo continúas si el estado significa "Aprobado", en cualquier idioma (`Aprobado`, `Approved`, `Aprovado`, `Approuvé`, `Genehmigt`…). Cualquier otro valor (Borrador, En revisión, Implementado, Obsoleto o uno que no reconozcas) detiene la skill con el mensaje de abajo. Si no encuentras la línea de estado, dile al usuario que la spec no sigue el formato esperado. Si dudas de lo que significa un valor, no asumas: pregunta.

```
❌ No puedo implementar esta spec.

Estado actual: [ESTADO ENCONTRADO]
Solo trabajo con specs cuyo estado significa "Aprobado".

Para continuar:
  1. Si la spec está lista, ábrela y cambia el estado a "Aprobado" tú mismo
     (ese cambio lo hace el humano, no el agente).
  2. Si todavía necesita trabajo, usa /spec [nombre] para retomarla.
```

El bloqueo es intencional: no ofrezcas empezar igual.

---

### Fase 3 — Mostrar el resumen de la spec y luego confirmar la rama git

Una vez confirmado que el estado significa `Aprobado`:

1. **Muestra primero un resumen corto de la spec.** El dev ya la leyó y la aprobó: el resumen solo le refresca de qué va antes de elegir rama, no la reemplaza. **No copies secciones de la spec al mensaje**; si quiere el detalle, abre el archivo. Usa exactamente este formato:

   ```
   📄 <ID> — <objetivo, una línea>
   Área: <valor, o "falta — se completa en la Fase 5.4">
   Depende de: <IDs aún sin implementar, o "nada pendiente">

   Plan (N pasos):
     1. <título del paso, una línea>
     2. ...

   Criterios: M (X verificables por mí · Y del dev)
   ```

   - **Objetivo, área y dependencias** salen del header (`**Objetivo:**`, `**Área:**`, `**Depende de:**` o su equivalente en otro idioma). Si la spec no tiene `Depende de`, omite esa línea. Si viniste de la búsqueda de pendientes de la Fase 1, ya sabes cuáles siguen sin implementar; si no, lee solo las primeras 8 líneas de cada dependencia para ver su estado.
   - **Paso:** solo su título o primera oración, máximo una línea; sin sub-bullets, archivos ni verificación.
   - **Criterios:** solo el conteo. Los del dev son los marcados `(dev)`; si la spec no los marca, escribe solo `Criterios: M` (la división se hace en la Fase 5.1).
   - El alcance no va en el resumen: lo cubren el objetivo y los pasos, y lo que queda fuera se vigila en la Fase 4.
   - Identifica los campos y secciones por su significado, no por la redacción exacta: la spec puede estar escrita en cualquier idioma.

2. Deriva el nombre de rama sugerido a partir del ID de la spec (el nombre del archivo sin la extensión). Formato: `spec/<ID>`. Es solo una sugerencia: el repo puede tener su propia convención de ramas, y ninguna parte del flujo depende del nombre de la rama. Ejemplos:

   - `20261014-reintentos-de-pago.md` → rama `spec/20261014-reintentos-de-pago`
   - `07-cobro-con-tarjeta.md` (legacy) → rama `spec-07-cobro-con-tarjeta`

3. **Después del resumen — como lo último de tu mensaje —** muestra la rama actual (ya la tienes del contexto de sesión de arriba) y **pregunta al usuario** antes de tocar cualquier rama. La pregunta debe cerrar el mensaje: no va nada después de ella, para que sea lo primero que el usuario vea sin hacer scroll hacia arriba. Un resumen largo nunca debe sacar la pregunta de la vista (es la regla de preguntas de arriba). Presenta la pregunta así:

   ```
   La rama sugerida para esta spec es: spec/<ID>
   Rama actual: [RAMA ACTUAL]
   Modo: normal (pausa tras cada paso) — agrega "auto" a tu respuesta para correr de corrido

   Opciones:
     1. Crear y cambiarme a `spec/<ID>` (sugerida)
     2. Quedarme en la rama actual `[RAMA ACTUAL]`
     3. Usar otro nombre de rama (dime cuál)

   ¿Cuál prefieres?
   ```

   En modo `--auto`, la línea de modo dice: `Modo: --auto (de corrido) — agrega "normal" a tu respuesta para pausar tras cada paso`. El modo no tiene pregunta propia: se cambia en esta misma respuesta (`1`, `1 auto`, `2 normal`…). Si la respuesta no menciona modo, queda el que venía de la invocación.

   **No crees ni cambies de rama hasta que el usuario responda.** Espera confirmación explícita.

4. Cuando el usuario responda (aplica primero el cambio de modo, si lo pidió):

   - **Opción 1 o 3** (la sugerida o la que dio el usuario): si la rama no existe, créala con `git checkout -b <rama>`; si ya existe, avisa (puede ser trabajo retomado) y cámbiate a ella. Confirma que el cambio fue exitoso.
   - **Opción 2:** no ejecutes ningún comando git; confirma que implementarás sobre la rama actual.

5. Confirma visualmente al usuario qué rama está activa:

   ```
   ✅ Listo para implementar.

   Spec:   specs/<ID>.md
   Rama:   [RAMA ACTIVA]  (activa)
   Estado: Aprobado   (← repite el valor real encontrado en la spec)
   Modo:   normal | --auto
   ```

   La respuesta a la pregunta de rama ya es la confirmación para empezar, en los dos modos: continúa a la Fase 4 sin volver a preguntar.

---

### Fase 4 — Implementar paso a paso

**Una regla por encima de todas, en los dos modos:** implementa lo que dice la spec. Si algo de la spec te parece subóptimo, menciónalo como observación pero implementa lo acordado. Los cambios a la spec van en la spec, no en el código por sorpresa.

#### Modo normal

Justo después del bloque de confirmación de la rama, di en una línea que harás una pausa tras cada paso para revisar el diff, y empieza el Paso 1.

Por cada paso: impleméntalo, corre su verificación focalizada (bloque **Checkpoints**), resume qué archivos tocaste, qué hiciste y el resultado de la verificación, y termina con `Paso N completado. ¿Revisas el diff y continúo con el Paso N+1?`. Espera confirmación antes de seguir.

#### Modo `--auto`

Justo después del bloque de confirmación de la rama, di en una línea que vas a correr los N pasos del plan de corrido, y empieza.

**Después de cada paso, antes de pasar al siguiente:**

1. **Diagnósticos.** Pide los diagnósticos de los archivos que tocaste en el paso y, si el paso cambió un contrato compartido, también los de quienes lo implementan o importan, con el mecanismo que indique el archivo de memoria del proyecto, o con la herramienta de diagnósticos del IDE de tu agente si tiene una. Si hay errores, detente. Si no hay forma de obtenerlos (el proyecto no indica ninguna, tu agente no tiene herramienta, o falla), **no frenes y no improvises** un compilador ni otro chequeo que el proyecto no autorizó: marca el paso `— sin diagnóstico`, dilo en una línea la primera vez y sigue. En el paso siguiente vuelve a intentarlo: la herramienta puede haber vuelto.
2. **Verificación del paso.** La focalizada del bloque **Checkpoints**: la línea de verificación del paso o, si no trae, los tests que el paso creó o tocó, siempre que la política de comandos te deje correrla. Si falla, detente. Los comandos reservados al dev y las pruebas manuales `(dev)` **no los corras y no frenan**: anótalos para el resumen final. Un comando que tendrías que preguntar **sí frena**: pregúntalo.
3. Anota qué archivos tocaste, qué hiciste y el resultado de 1 y 2, y sigue con el próximo paso sin preguntar.

**Frenos — detente siempre que pase cualquiera de estos:**

- Una **ambigüedad** que la spec no resuelve (aplica la regla de abajo, igual que en modo normal).
- El paso necesita algo **fuera del alcance** de la spec.
- Para cumplir el paso tendrías que **desviarte del plan**: contradecir la spec, o tocar algo notable que el paso no menciona.
- **Errores en los diagnósticos** al terminar el paso.
- **Falla la verificación** del paso.

Nunca arregles en silencio lo que provocó el freno para seguir corriendo. Detenerse es el punto.

**Al detenerte, o al terminar el último paso**, muestra una tabla con todos los pasos que hiciste hasta ahí:

```
| Paso | Archivos tocados | Qué hizo | Diagnósticos | Verificación |
| ---- | ---------------- | -------- | ------------ | ------------ |
| 1    | ...              | ...      | ✅ limpio    | ✅ 4/4 tests |
| 2    | ...              | ...      | ✅ limpio    | (dev) prueba manual |
| 3    | ...              | ...      | — sin diagnóstico | ✅ 2/2 tests |
```

Debajo, la lista de comandos y pruebas manuales `(dev)` que quedaron pendientes para el desarrollador. Si algún paso quedó sin diagnóstico, súmale una sola línea, sin enumerar archivos (la tabla ya dice cuáles pasos): `N pasos sin diagnóstico: los cubre tu verificación.` Si te detuviste por un freno, agrega el motivo con exactitud y termina con la única pregunta que ese freno necesita para resolverse (las opciones de la ambigüedad, el comando a autorizar, qué hacer con el error). Con la respuesta, sigues en `--auto` desde donde quedaste. No ofrezcas cambiar de modo: si el dev quiere modo normal, lo pide él. Si terminaste todos los pasos, sigue con el mensaje de "Al terminar el último paso" de abajo.

En los dos modos, nunca hagas commit.

#### Reglas comunes a los dos modos

**Si durante la implementación encuentras una ambigüedad** que la spec no resuelve:

- Detente.
- Describe la ambigüedad con exactitud.
- Presenta dos o tres opciones concretas.
- Espera la decisión del usuario.
- No improvises.

**Si un paso cambia un contrato compartido** (interfaz, protocolo, tipo exportado, firma pública) y el plan no nombra a todos sus consumidores, búscalos tú: quién lo implementa o lo importa, incluidos los fakes de test. Actualízalos en ese mismo paso, no en uno posterior. No es un freno, porque es mecánico y no contradice la spec, pero sí entra en la lista de desviaciones.

**Lleva una lista de desviaciones desde el Paso 1.** Es la materia prima de la sección "Desviaciones" que se escribe en la Fase 5.3, y solo existe en esta sesión: una sesión nueva ya no sabría dónde te detuviste. Anota una entrada, en el momento en que ocurre, cada vez que:

- Te detuviste a preguntarle al usuario: una ambigüedad, un freno de `--auto`, un desvío del plan.
- Hubo que partir, juntar o reordenar un paso del plan.
- Actualizaste consumidores de un contrato que el plan no nombraba (tipo paso, causa `plantilla:plan`).
- Un criterio de aceptación se reescribió porque el criterio estaba mal (Fase 5.1).

Cada entrada lleva su tipo (ambigüedad, paso, criterio), qué faltaba o qué cambió en una línea, y la causa propuesta según el vocabulario de la sección "Desviaciones" de `template.md` (en el directorio de la skill `/spec`). Lo que resolviste solo, sin preguntar, no entra, salvo los consumidores de un contrato que el plan no nombraba. No la muestres en cada paso: se revisa entera en la Fase 5.3.

**Si el usuario pide algo que está fuera del alcance de la spec:**

- Recuérdale que está fuera del alcance de esta spec.
- Sugiere anotarlo para la próxima spec.
- No lo implementes en esta rama.

**Al terminar el último paso:**

- **Modo normal:** la pausa del último paso es la única pregunta antes del cierre: `Paso N completado. Revisa el diff; cuando me digas, sigo con el cierre.` Con la confirmación, entra a la Fase 5 sin volver a preguntar.
- **Modo `--auto`:** después de la tabla, si no hubo freno, entra directo a la Fase 5 sin preguntar.

**No termines el comando aquí.** La Fase 5 es parte del trabajo: sin ella quedan specs con el checklist sin marcar y el estado sin mover, y nadie sabe qué se verificó.

---

### Fase 5 — Cerrar la spec

El trabajo no está terminado cuando se escribe el último paso del plan. Está terminado cuando alguien sabe qué criterios pasaron, qué aprendió el proyecto, en qué falló la spec como contrato y qué spec anterior acaba de quedar desactualizada. Esas cuatro cosas son esta fase.

Ejecuta los cinco pasos en orden. Cada paso pregunta **solo si hay algo que decidir**, y aplica la regla de preguntas: si 5.2 pregunta, 5.3 va en el mensaje siguiente. Lo normal es que un cierre limpio no pregunte nada.

#### 5.1 — Ejecutar los criterios de aceptación que puedes ejecutar

**Nunca te lo saltes**, ni siquiera cuando los criterios parezcan obvios o la implementación haya salido limpia. No se pregunta: tus criterios son de solo lectura o usan comandos que la política ya autoriza.

Primero divide el checklist en dos. Un criterio es tuyo si puedes resolverlo leyendo el repo, con un comando de solo lectura o con un comando que la política de comandos te deja correr; es del dev si necesita un backend real, un juicio visual o un comando que el proyecto le reserva a él.

| Tuyos | Del dev |
| --- | --- |
| Un archivo, ruta o export existe | Un comando que el archivo de memoria del proyecto reserve para el desarrollador (si lo permite al agente, es tuyo aunque la spec lo marque `(dev)`) |
| Un import que no debe existir, un string que no debe aparecer en ningún lado | Cualquier cosa que necesite un navegador, si tu agente no tiene uno o el proyecto no lo permite |
| Firmas de tipos, diagnósticos | Llamadas contra un backend real |
| Un símbolo o patrón que el proyecto prohíbe, presente o ausente | Colores, layout, responsive, cualquier cosa visual |
| Los tests que la política de comandos te deja correr | |

La spec ya debería marcar los del dev con `(dev)`. Si no lo hace, divídelos tú — y di en voz alta cuáles clasificaste como del dev, para que una mala división sea visible en vez de silenciosa.

Antes de los criterios, corre el chequeo de cierre del bloque **Checkpoints**; sus resultados sirven de evidencia para los criterios de tipos, lint y tests.

Luego anúncialo en una línea y ejecútalos sin esperar respuesta:

> Verifico N de los M criterios de aceptación; los otros M−N son tuyos[: los que clasifiqué yo como del dev].

Al ejecutarlos:

- Marca `[x]` **solo** lo que realmente ejecutaste y pasó, y agrega entre paréntesis cómo lo verificaste.
- Deja todo lo demás `[ ]` exactamente como está — sin sufijo agregado. La marca `(dev)` ya dice quién lo ejecuta, y la casilla vacía ya dice que está pendiente.
- **Nunca marques una casilla que no ejecutaste**, ni porque el código "debería" cumplirlo ni para que la lista se vea terminada: una casilla marcada por error se queda en el repo y después se cree.
- Si un criterio **falla**: déjalo sin marcar, di cuál y qué obtuviste, y detente a preguntar. No lo arregles por tu cuenta: puede estar mal el código o el criterio.
- Si el usuario decide que **el criterio** estaba mal (no era booleano, pedía algo fuera del alcance, estaba mal marcado `(dev)`…): reescríbelo en la spec con su confirmación y anótalo en la lista de desviaciones como criterio mal escrito.

#### 5.2 — Rescatar lo que aprendió el proyecto

Para cada decisión o convención que terminó en el código, decide **si se conserva y dónde**. Solo lo duradero sale de la spec, y el archivo de memoria del proyecto (se carga en cada sesión) es el destino más caro y el último recurso.

**Primero, el filtro.** Hazte estas preguntas en orden. Un solo "no" (o un "sí" en la pregunta 1) y no va a ningún lado salvo a la propia sección "Decisiones tomadas y descartadas" de la spec:

1. **¿Un agente lo deduciría leyendo el código o los docs del proyecto?** Si es así, ya está escrito. Eso cubre la API de un componente (sus props, sus variantes), un helper que ya vive en el código compartido del proyecto, un patrón que es obvio a partir del único archivo que lo implementa, y cualquier cosa que ya diga un doc. El código es la documentación del *cómo*. Conserva solo el *por qué no de la forma obvia* que el código no puede expresar.
2. **¿Sirve más allá de esta feature?** ¿Aplicaría a una feature futura que no sea esta, de esta misma área o de otra? "Cómo se renderiza el carrito de este módulo" no lo es. "Dónde vive el estado" sí. Las buenas prácticas genéricas (DRY, única fuente de verdad) no cuentan: todo agente ya las aplica.
3. **¿Es nuestro, o está verificado?** Una decisión que tomamos, o un hecho del mundo exterior que alguien realmente comprobó. Un supuesto todavía marcado como no verificado en la sección de Supuestos externos de la spec **nunca** se promueve — esa promoción es exactamente cómo una suposición se convierte en un hecho que nadie vuelve a revisar, y luego en días de depuración en el lugar equivocado.
4. **¿Es caro no saberlo?** No saberlo causa un fallo caro o silencioso (un hueco de seguridad, un build roto, un loop de redirecciones, una sesión perdida), o va en contra de lo que cualquier agente competente haría por defecto.

**Luego, el destino.** Lo que sobrevive al filtro va al lugar más acotado que todavía se lea cuando importe:

| Qué es | A dónde va |
| --- | --- |
| Cómo funciona hoy un área que tocó la spec | El "Doc vigente" de esa área en la tabla de áreas de `specs/README.md`, en la sección que le corresponde |
| Convención de capas, contrato entre capas, estructura de carpetas, traducciones, o cualquier tema que el repo ya tenga documentado aparte | El doc del proyecto que ya cubre ese tema (los que nombran el archivo de memoria y la tabla de áreas) |
| Una regla o trampa que aplica a **cualquier** sesión, en cualquier módulo, y pasó las cuatro preguntas | El archivo de memoria del proyecto |

**Si el área de la spec tiene `—` como doc vigente** y algo pasó el filtro, sigue `references/doc-nuevo.md` (en este directorio) antes de proponer.

Una entrada en un doc recibe un puntero de una línea en el archivo de memoria del proyecto **solo** si un agente, de otro modo, caería en la trampa sin abrir nunca ese doc. Para todo lo demás, el puntero existente al doc es suficiente.

**Si no hay nada que proponer** (ninguna entrada, ninguna poda, ningún doc nuevo), dilo en una línea y sigue a 5.3 sin preguntar:

> Nada pasa el filtro: [motivo en una línea de los descartes notables, p. ej. "la prop `side` del drawer — visible en el componente"].

**Si hay algo**, propón, no escribas todavía. Entradas, podas y doc nuevo van en **una sola lista numerada** con una sola pregunta al final:

> De esta spec:
>
> 1. A `<doc del proyecto>` §N: [qué, en una oración].
> 2. A [el archivo de memoria del proyecto]: **[Regla].** [Una oración del porqué.] (spec <ID>)
> 3. Podar de [el archivo de memoria del proyecto]: [línea] — ya la cubre [doc o código].
>
> Descartes notables: [en una línea].
>
> ¿Entran? (todas / los números / ninguna)

Límites que mantienen esto sostenible:

- **Una línea cada una** en el archivo de memoria del proyecto. Si no cabe en una línea, pertenece a un doc del proyecto.
- **Nada de APIs de componentes, nombres de props ni recetas a nivel de archivo** en el archivo de memoria del proyecto. Ese es trabajo del código.
- **Cero entradas es el resultado normal**, y el esperado para la mayoría de las specs. Proponer algo por haber propuesto algo es cómo ese archivo duplica su tamaño y deja de leerse.
- **Tope duro: 8 líneas** en la sección de specs del archivo de memoria del proyecto. Si está llena, no agregues. Propón primero mover una línea existente a un doc del proyecto.
- **Poda en cada cierre.** Relee esa sección. Si una línea ahora está cubierta por un doc del proyecto, o por código que escribió esta spec, propón borrarla en el mismo mensaje. Ese archivo viaja en cada sesión: su costo se paga en cada request, para siempre.

#### 5.3 — Desviaciones

**Siempre se escribe**, aunque esté vacía. Toma la lista de desviaciones que llevaste desde el Paso 1 y muéstrala agrupada, con la causa propuesta en cada entrada:

> Desviaciones de esta implementación:
>
> **Ambigüedades no resueltas por la spec:**
> - [qué faltaba, en una línea] → `fase2:datos`
>
> **Pasos reordenados o partidos:**
> - [qué cambió y por qué, en una línea] → `plantilla:plan`
>
> **Criterios mal escritos:**
> - [cuál y qué tenía mal] → `plantilla:criterios`
>
> ¿Falta alguna o cambio alguna causa?

La pregunta cierra el mensaje: 5.4 va en el siguiente, después de la respuesta.

Si la lista está vacía, dilo en una línea (`Sin desviaciones: la implementación siguió la spec sin detenerse.`) y escribe la sección sin preguntar.

**No completes la lista de memoria al final**: lo que no anotaste cuando pasó, no lo reconstruyas suavizado. Si el usuario recuerda una que falta, agrégala.

Escríbela en la spec como `## Desviaciones`, justo antes de la sección final de "Lo que no entra" (o al final si no la tiene), con el formato del template: primero `> Retro: pendiente`, después los sub-bloques con entradas o `Sin desviaciones.`. Si la spec ya tiene la sección (se retomó una implementación), agrega las entradas nuevas y deja la línea `Retro:` como esté.

#### 5.4 — Estado y trazabilidad

Todo este paso se hace sin preguntar, salvo el `Área` cuando falta, no encaja o necesita una fila nueva en la tabla de áreas.

- Cambia el `Estado` de la spec al valor que signifique **Implementado**, en el idioma que use el repo.
- Llena `Rama` con la rama en la que se implementó.
- Revisa `Área`: que esté, que cada valor exista en la tabla de áreas de `specs/README.md`, y que siga describiendo lo que la implementación terminó tocando. Si falta o no encaja, propón el valor y pregunta. Si el área es nueva (o `specs/README.md` todavía no existe: es la primera spec cerrada del repo), propón su fila para la tabla de áreas y escríbela con confirmación después de que el script del paso siguiente cree el archivo.
- Si esta spec invalidó, corrigió o rehízo parte de una anterior, escribe **ambos** lados: `Supera a: <ID de la vieja>` aquí, y `Superada por: <ID de esta>` en esa otra spec. En esos campos las specs se citan por ID en texto plano (el nombre del archivo sin `.md`); solo una spec legacy `NN-slug.md` se cita como `SPEC NN`. En la prosa que escribes en la spec (desviaciones, notas) va un link con el slug, `[slug](ID.md)`, como indica `template.md`. Sin los dos lados, quien llegue a la spec vieja no sabe que fue reemplazada.
- Un reemplazo parcial lleva la palabra `parcial` en los dos lados (`20261014-reintentos-de-pago (parcial: …)`); uno total, no. El índice usa esa palabra para decidir si la spec vieja sigue entre las vigentes de su área: si la omites en un reemplazo parcial, la parte que sigue en pie desaparece del contexto de la próxima `/spec`.
- Si la spec tiene una tabla de Supuestos externos, actualízala. Lo que la implementación realmente verificó recibe su estado, su fecha y cómo se verificó. Lo que sigue sin verificar queda sin verificar — terminar la feature no es evidencia.
- Ejecuta `node <ruta-de-la-skill-spec>/scripts/specs-index.mjs` (la skill `spec` es hermana de esta: `../spec/scripts/specs-index.mjs` relativo a este directorio) desde la raíz del repo para regenerar `specs/INDEX.md`: el índice recoge el estado, la rama, el área, supera a / superada por y consolidada en, y la tabla "Specs vigentes por área" se reordena. `INDEX.md` es un archivo generado; `specs/README.md` (el vocabulario de áreas) no lo toca el script, salvo crearlo si falta. Si la salida tiene `⚠ área desconocida`, `⚠ header incompleto`, `⚠ referencia desconocida` o `⚠ doc inexistente` en alguna fila de esta spec, corrígelo antes de seguir. Si avisa `⚠ slug repetido` con esta spec, dilo: puede ser la misma feature escrita dos veces.
- En la salida del script, mira la fila de cada área de esta spec en "Specs vigentes por área". Si el área tiene doc vigente y 5 o más specs vigentes, agrega una línea: `El área <área> tiene N specs vigentes y /spec lee 4: cuando quieras, corre /spec-consolidar <área>.` Solo el aviso; nunca la ejecutes. Si el área no tiene doc, ya lo cubrió `references/doc-nuevo.md` en 5.2.
- Cuenta los archivos de `specs/` que tienen la línea `> Retro: pendiente` (por contenido, no por nombre de spec), buscando `^> Retro: pendiente` por la vía del bloque **Lectura y búsqueda** (con `git grep`, usa `-l`) y contando los archivos. Si son 10 o más, agrega una línea: `Van N specs cerradas sin retro: cuando quieras, corre /spec-retro.` Solo el aviso; nunca la ejecutes.

#### 5.5 — Commit

Nada especial aquí, y es deliberado: **nunca hagas commit sin que el usuario lo pida explícitamente**, y tampoco propongas qué stagear.

Termina con **un solo bloque de resumen** del cierre, en vez de narrar cada subpaso por separado:

```
✅ Spec cerrada: specs/<ID>.md → [estado Implementado]

Criterios:    x/M marcados · pendientes (dev): [lista]
Conservado:   [qué entró a docs / memoria, o "nada"]
Desviaciones: [N, o "sin desviaciones"]
Working tree: [archivos modificados]
```

Y detente.

