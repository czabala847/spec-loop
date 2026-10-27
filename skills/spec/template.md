# Plantilla de una spec útil

Este archivo es la referencia que consulta la skill `/spec` al generar specs. Cada sección incluye su propósito y un ejemplo mínimo. **No es texto para copiar literalmente** — es la forma que la skill debe respetar.

---

## Encabezado

Toda spec empieza con metadatos en formato blockquote (sin tablas, sin bloques, simple como se muestra abajo):

```markdown
# Título corto y descriptivo

> **Estado:** Borrador · **Depende de:** 20260901-alta-de-clientes, 20260915-notificaciones-email · **Fecha:** YYYY-MM-DD
> **Rama:** — · **Área:** facturacion, notificaciones · **Supera a:** — · **Superada por:** —
> **Objetivo:** Una sola oración. Si necesitas dos oraciones, la feature es demasiado grande.
```

**El archivo se llama `specs/AAAAMMDD-slug.md`** (la fecha en que se escribió y un slug corto), y **el nombre sin `.md` es el ID de la spec**: es lo que la identifica. No hay numeración secuencial: un contador obliga a mirar "cuál es el último" y dos personas (o dos sesiones en paralelo) leen el mismo último y chocan; la fecha y el slug no dependen de nada compartido. El título no lleva número.

**Cómo se cita una spec** depende de dónde:

- **En los campos del encabezado** (`Depende de`, `Supera a`, `Superada por`): el ID en texto plano (`20260928-otp-en-login-native`), sin link. Es lo que leen el script y las skills.
- **En la prosa de una spec**: un link que muestra el slug y apunta al archivo: `[otp-en-login-native](20260928-otp-en-login-native.md)`. Se lee bien, se abre con un clic, y el ID completo sigue en el destino del link para buscarlo con grep.
- **Fuera de `specs/`** (comentarios de código, el archivo de memoria del proyecto, docs): el ID en texto plano, p. ej. `(spec 20260928-otp-en-login-native)`.
- **El `Objetivo` no cita specs.** Es la línea que un humano lee en 5 segundos: si hace falta nombrar la spec de la que parte, va en el Alcance.

> Un repo que adoptó estas skills antes puede tener specs `NN-slug.md` con títulos `# SPEC NN — …`, citadas como `SPEC NN`. Son legacy: se leen, se citan así y el índice las entiende, pero nunca se crea una spec nueva con número.

| Campo | Qué va |
| --- | --- |
| `Estado` | Ver los estados válidos abajo |
| `Depende de` | Los IDs de las specs sobre las que se construye esta, separados por comas |
| `Fecha` | El día en que se escribió la spec, `YYYY-MM-DD` |
| `Rama` | La rama en la que se implementó. `—` hasta que `/spec-impl` la llena |
| `Área` | De 1 a 3 áreas que la spec cambia, separadas por comas, tomadas **solo** de la tabla de áreas de `specs/README.md` |
| `Supera a` | Las specs que esta invalida o rehace, total o parcialmente |
| `Superada por` | Se llena **después**, por quien escriba la spec que reemplaza a esta |
| `Objetivo` | Una oración que un humano lee en 5 segundos. No cita specs |
| `Consolidada en` | **Opcional, no va en una spec nueva.** Se agrega solo al consolidar: la ruta del doc (desde la raíz del repo) donde ya vive lo que esta spec decidía |

**Estados válidos:** `Borrador`, `En revisión`, `Aprobado`, `Implementado`, `Obsoleto`.

> Las etiquetas de arriba son las que usa este repo. Las skills también aceptan sus equivalentes en otros idiomas (p. ej. en inglés `Draft` / `In review` / `Approved` / `Implemented` / `Obsolete`), y el script `specs-index.mjs` reconoce los campos en español y en inglés. Elige un juego por repo y mantente consistente.

**Escribe todos los campos, y usa `—` cuando uno esté vacío.** Un campo con `—` dice que alguien miró y no había nada; un campo que no está no dice nada. Para `Superada por` esa diferencia es todo el sentido del campo.

**`Área` es lo que hace encontrable a la spec.** Las specs se nombran por fecha, pero se buscan por tema: `/spec` busca el campo en los headers para saber qué leer antes de escribir la siguiente, y el script `specs-index.mjs` agrupa por área las specs vigentes en `specs/INDEX.md`. Es el único campo que nunca lleva `—` — toda spec cambia algo de alguna área. Si ninguna encaja, el área nueva se agrega primero a la tabla de `specs/README.md`; nunca se inventa en el header, porque un sinónimo (`factura` vs `facturacion`) parte el área en dos y cada mitad esconde a la otra.

**`Supera a` y `Superada por` siempre viajan en pareja.** Si `20261020-reintentos-de-pago` supera a `20260901-cobro-con-tarjeta`, la nueva dice `Supera a: 20260901-cobro-con-tarjeta` **y** la vieja dice `Superada por: 20261020-reintentos-de-pago`. Escribir solo uno de los dos es peor que no escribir ninguno: quien llegue a la spec vieja no tiene forma de saber que fue reemplazada — y las specs se leen llegando a ellas, no en orden.

**Cuando el reemplazo es parcial, dilo con la palabra `parcial`**: `Superada por: 20261020-reintentos-de-pago (parcial: el cobro fallido ya no se cancela al primer intento)`. Sin ella, el índice entiende que la spec quedó reemplazada entera y la saca de las vigentes de su área.

**`Consolidada en` saca a la spec de las vigentes sin que otra la reemplace.** Cuando el comportamiento y las "Decisiones tomadas y descartadas" de una spec ya están escritos en el doc vigente de su área, la spec se marca `Consolidada en: docs/facturacion.md` (o `docs/facturacion.md §3`; la ruta es la del doc vigente de su área en `specs/README.md`, esté donde esté) y el índice la pasa a la columna "Consolidadas en un doc": `/spec` lee el doc, no la spec. Es la excepción a "escribe todos los campos": un header sin él significa "no consolidada", y por eso nunca se escribe con `—`. No se usa `Superada por` para esto: ese campo nombra specs, y un doc ahí es una referencia rota. Solo se marca si **todo** lo que `/spec` leería de ella está en el doc: sus decisiones tomadas y descartadas que siguen en pie, y lo que dejó fuera de alcance y sigue pendiente. Si le falta algo, o se agrega primero al doc o la spec sigue vigente; marcarla igual hace que eso se pierda en silencio. Lo que ya no sigue en pie (una decisión que otra spec revirtió) no hace falta en el doc. Este criterio es el mismo al crear un doc nuevo (`/spec-impl`) y al consolidar en uno que ya existe (`/spec-consolidar`).

**Regla del objetivo:** una oración que un humano lee en 5 segundos y entiende qué se va a construir. Si no cabe en una oración, divide la feature.

---

## Sección 1 — Por qué existe esta spec (opcional)

Para specs que toman decisiones no obvias o rompen patrones del proyecto, una sección breve que explique el **porqué** del trabajo. No el qué — el qué viene después.

Para specs simples, omítela.

---

## Sección 2 — Alcance

Dos sub-bloques explícitos. **Ambos son obligatorios.**

```markdown
## Alcance

**Dentro:**

- Cosa concreta uno.
- Cosa concreta dos.

**Fuera de alcance (para specs futuras):**

- Algo que se podría hacer pero no ahora.
- Algo que salió en la conversación pero no entra.
```

**Por qué importa el "fuera":** captura las cosas que el usuario mencionó durante la fase de preguntas pero que se decidió diferir. Sin ese registro, durante la implementación aparecerá la tentación de colarlas "ya que estamos".

---

## Sección 3 — Modelo de datos

Las estructuras concretas que aparecen o cambian. Usa código real, no pseudocódigo abstracto.

```markdown
## Modelo de datos

\`\`\`json
{
  "version": 1,
  "level": 1,
  "score": 0,
  "highScores": [{ "score": 1200, "level": 3, "date": "2026-09-01" }]
}
\`\`\`

Convenciones:

- `highScores` guarda como máximo 10 entradas, ordenadas de mayor a menor.
- `date` en formato `YYYY-MM-DD`.
```

Si la feature no introduce datos nuevos, escríbelo explícitamente: _"Esta feature no introduce estructuras de datos nuevas. Reusa el modelo de [alta-de-clientes](20260901-alta-de-clientes.md)."_

---

## Sección 4 — Supuestos externos

**Obligatoria siempre que el diseño dependa del comportamiento de algo que no controlamos**: el backend, el proveedor de identidad, un servicio de terceros, el navegador. Omite la sección solo cuando no exista esa dependencia — no hace falta decir que no aplica, simplemente déjala fuera.

```markdown
## Supuestos externos

| Supuesto | Cómo se verificó | Fecha | Estado |
| --- | --- | --- | --- |
| La API de récords en línea acepta hasta 100 puntajes por petición | — | — | ❌ No verificado |
| La API de récords responde `429` al pasar el límite de peticiones | Llamadas manuales seguidas: a partir de la 31.ª en un minuto responde `429` | 2026-09-10 | ✅ Verificado |
```

**Las reglas alrededor de esta tabla son su razón de ser:**

- Un supuesto marcado `No verificado` **nunca** se promueve al archivo de memoria del proyecto ni a sus docs como hecho. Se queda aquí, en la spec que lo hizo.
- Una spec posterior **no hereda** un supuesto de una anterior. O lo vuelve a listar como no verificado, o lo verifica y dice cómo.
- Toda fila `No verificado` **y** que sostenga el diseño debe decir, en la sección de Riesgos, qué pasa si resulta falsa.

Por qué existe esta sección: una spec la lee meses después alguien (o algo) que no puede distinguir entre "esto lo comprobamos" y "esto lo asumimos", porque la prosa hace que ambos suenen igual de seguros. Esta tabla es esa diferencia, por escrito.

---

## Sección 5 — Plan de implementación

Pasos numerados. Cada paso debe dejar el sistema en un estado **funcional y ejecutable**. Nada de "implementar la mitad y seguir mañana".

```markdown
## Plan de implementación

1. Crear el archivo X con un esqueleto vacío.
2. Implementar la función A en X. Prueba manual: ejecutar Y, ver Z.
3. Conectar X con el módulo existente W.
4. ...
```

**Reglas:**

- Cada paso debe poder commitearse por sí solo: si mueve, reemplaza o empieza a usar algo, ese mismo paso borra el original, agrega los tipos que necesita y desmonta lo que choque con lo nuevo. Un "paso de limpieza" al final es señal de que los anteriores no compilaban.
- Si un paso cambia o amplía un **contrato compartido** (interfaz, protocolo, tipo exportado, firma pública), lo deja completo de una vez, con todo lo que la spec le va a pedir, y no método por método en pasos sucesivos. Ese mismo paso actualiza **todos** sus implementadores e importadores, también los fakes de test, y los lista en una línea `Consumidores:`. La lista sale de buscar en el repo quién implementa o importa el contrato, no de memoria. Si no hay ninguno fuera de los archivos del paso, la línea se omite.
- Si un paso requiere más de 30–50 líneas de código, divídelo por porciones completas (un tipo, un componente), nunca en "agregar" y luego "borrar".
- El último paso del plan **no** es "probar todo" — eso son los criterios de aceptación.

---

## Sección 6 — Criterios de aceptación

Checklist booleano. Cada ítem se puede verificar con sí o no.

**Cada criterio dice quién lo ejecuta.** Agrega el sufijo `(dev)` a los que un agente no puede ejecutar — cualquier cosa que necesite un navegador, un backend real, una revisión visual o un comando que el archivo de memoria del proyecto reserva para el desarrollador. Antes de marcar un comando como `(dev)`, consulta la política de comandos de ese archivo: un comando que permite al agente no se marca, aunque en otro repo sea del dev. Todo lo demás se asume verificable por el agente.

```markdown
## Criterios de aceptación

- [ ] Si el archivo de progreso no existe, el juego arranca en el nivel 1 sin error.
- [ ] Un archivo de progreso con `version` desconocida se ignora y el juego arranca en el nivel 1.
- [ ] El chequeo estático del proyecto no reporta errores en los archivos que toca la spec ni en sus consumidores.
- [ ] Al cerrar y reabrir el juego, el nivel y el puntaje son los mismos que antes de cerrar. (dev)
```

Un criterio que nadie puede ejecutar no es un criterio. Decir quién ejecuta cada uno es lo que convierte el checklist en algo que realmente se ejecuta al cierre, en vez de devolverse entero con todas las casillas todavía vacías.

**Anti-patrones a evitar:**

- ❌ "Que funcione bien." → no verificable.
- ❌ "Buena UX." → subjetivo.
- ❌ "Sin bugs." → no operativo.
- ❌ "El lint termina sin errores." / "El diff contra la rama principal no toca X." → falla por errores previos o por commits ajenos en la rama. ✅ "El lint del proyecto no reporta errores en los archivos que toca la spec ni en sus consumidores." / "Ningún archivo del módulo de guardado importa X." El chequeo se corre sobre el proyecto entero (así aparecen los consumidores rotos), pero el criterio pasa o falla por lo que hace esta spec, no por el estado del repo ni de la rama.
- ❌ Un `(dev)` que repite lo que ya prueba un criterio automático. Un `(dev)` evalúa lo que un test no puede: el juicio visual o responsive, el flujo real de punta a punta o un entorno externo.
- ✅ "Presionar Esc pausa el juego y muestra el menú." → verificable, booleano.

**Nunca marques una casilla de antemano.** Una spec se escribe antes de que exista el código, así que toda casilla empieza como `[ ]`. Una casilla se marca cuando alguien ejecutó esa verificación y pasó — no cuando se escribió el código que debería cumplirla.

---

## Sección 7 — Decisiones tomadas y descartadas

La sección que más valor tiene dentro de 3 meses. Captura **lo que consideraste**, no solo lo que elegiste.

```markdown
## Decisiones tomadas y descartadas

- **Sí:** un archivo local para el progreso. Son pocos datos, de un solo jugador y sin consultas.
- **No:** una base de datos. Sobreingeniería para este caso.
- **Sí:** campo `version` en el archivo. Permite migrar el esquema después sin romper.
- **No:** sincronización en la nube. Va en otra spec si alguna vez llega.
```

Idealmente cada decisión tiene un motivo breve. Las decisiones sin motivo son las primeras en cuestionarse después.

---

## Sección 8 — Riesgos identificados (opcional)

Solo cuando hay riesgos no obvios. Tabla simple:

```markdown
## Riesgos identificados

| Riesgo                                     | Mitigación                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------- |
| Sin permiso de escritura en disco          | El progreso se mantiene en memoria. El juego sigue corriendo, solo que no persiste. |
| Esquema futuro incompatible                | El archivo incluye `version`. La migración es un paso propio del plan.              |
```

Para specs pequeñas o features muy contenidas, omítela.

---

## Sección 9 — Desviaciones (la escribe `/spec-impl`)

**`/spec` no escribe esta sección.** La agrega `/spec-impl` al cerrar la implementación, en todas las specs, aunque no haya nada que contar. Registra en qué falló la spec como contrato, no qué se decidió: el detalle de una decisión tomada al implementar sigue yendo a "Decisiones tomadas y descartadas".

```markdown
## Desviaciones

> Retro: pendiente

**Ambigüedades no resueltas por la spec:**

- El plan no decía qué mostrar si el endpoint devolvía una lista vacía. → `fase2:ux`

**Pasos reordenados o partidos:**

- El paso 3 se partió en dos: tocaba dominio e infraestructura a la vez. → `plantilla:plan`

**Criterios mal escritos:**

- El criterio 4 no era booleano ("carga rápido"). → `plantilla:criterios`
```

Qué cuenta como desviación lo define `/spec-impl` (Fase 4, "Reglas comunes a los dos modos"). Un sub-bloque sin entradas se omite. Si los tres quedan vacíos, la sección dice `Sin desviaciones.` debajo de la línea `Retro:` — también es un dato.

**Cada entrada termina con su causa**: la pieza del proceso que debió atraparla. Vocabulario cerrado:

| Causa | Cuándo |
| --- | --- |
| `fase0` | El triaje dejó pasar un pedido vago o que dictaba la implementación |
| `fase2:<categoría>` | Una de las categorías de preguntas de `/spec` debió cubrirlo: `alcance`, `datos`, `integración`, `persistencia`, `ux`, `riesgos`, `decisiones` |
| `fase2:nueva` | Ninguna categoría de preguntas lo cubría |
| `tamaño` | El control de tamaño no se disparó y la spec era demasiado grande |
| `plantilla:<sección>` | La sección del template no pedía lo que hacía falta: `encabezado`, `alcance`, `datos`, `supuestos`, `plan`, `criterios`, `decisiones`, `riesgos` |
| `spec-impl` | La spec estaba bien; falló la implementación |

**La línea `> Retro:`** es el estado de esta spec frente a `/spec-retro`: nace `pendiente` y la retro la cambia a la fecha en que la leyó (`> Retro: 2026-11-20`). Es lo único que la retro toca de una spec. No depende del nombre de la spec: la retro busca los archivos que dicen `pendiente`.

---

## Sección final — Lo que NO entra (refuerzo)

Repite explícitamente al final lo que **no** se hará en esta spec. Esta repetición es deliberada — la sección de Alcance ya lo dice, pero al final del documento sirve de recordatorio para quien lee solo las últimas líneas.

```markdown
## Lo que **no** entra en esta spec

- Editor visual (otra spec si alguna vez llega).
- Multijugador.
- Versión móvil.

Cada una de esas, si llega, va en su propia spec.
```

---

## Reglas globales sobre todo el documento

- **Una oración por idea.** Si una oración tiene dos comas y un punto y coma, divídela.
- **Nombres concretos.** Si dices "el módulo de niveles", da su ruta exacta en el repo. Si dices "una key", da el string exacto.
- **Sin TODOs.** Un TODO en una spec significa que la decisión no se tomó. Tómala o anótala como decisión pendiente con un motivo.
- **Sin código ejecutable largo.** La spec describe; el código se escribe después. Fragmentos cortos para ilustrar estructuras de datos están bien; funciones completas no.
- **Markdown estándar.** Sin extensiones raras. Debe renderizarse en GitHub sin sorpresas.
