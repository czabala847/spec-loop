---
name: spec
description: Diseña y desarrolla specs siguiendo el método spec-driven. Primero hace triaje del pedido (lo rechaza cuando es demasiado vago para ser un contrato, separa problema de solución cuando dicta la implementación, lo divide cuando es demasiado grande), luego hace preguntas de aclaración y construye la spec sección por sección. Úsala al arrancar una feature grande, antes de escribir código.
disable-model-invocation: true
argument-hint: 'descripción corta de la feature o requerimiento'
---

# /spec — Diseñador guiado de specs

Esta skill te ayuda a producir una spec útil siguiendo el método spec-driven. **Aquí no escribes código.** Tu trabajo es ayudar al usuario a aclarar qué quiere construir, preguntar cuando algo no está suficientemente definido y desarrollar la spec sección por sección hasta que esté lista para guardarse en `specs/`.

## Filosofía

Una spec no es documentación decorativa. Es el contrato que guía la ejecución posterior. Si la spec es vaga, el código improvisará. Por eso este flujo es **deliberadamente lento en la fase de definición** y **rápido en la fase de escritura**.

La estructura de la spec está en `template.md` (en el mismo directorio que esta skill). Léelo al empezar la Fase 3, no antes: las fases 0 a 2 no lo necesitan.

## Flujo del comando

- Sigue las cinco fases en orden, empezando por la Fase 0. **No te saltes fases.** Si el usuario quiere ir más rápido, recuérdale que el costo de una mala spec se paga después en código.
- **La Fase 0 puede terminar el comando.** El resultado A lo detiene de inmediato. Detenerse es un resultado correcto, no un fallo al ayudar: una spec escrita a partir de un pedido que nadie había pensado cuesta más que no tener spec.
- Tus respuestas deben estar en el mismo idioma que el prompt inicial. Ej.: si el prompt inicial está en español, tus respuestas deben estar en español; si está en inglés, tus respuestas deben estar en inglés.

**Lectura y búsqueda.** Para leer, listar o buscar texto en archivos, en este orden:

1. **Las herramientas nativas de tu agente** (leer archivo, buscar texto, buscar archivos; p. ej. Read, Grep y Glob en Claude Code). Si las tienes, úsalas siempre.
2. **Si tu agente no tiene búsqueda nativa**, un solo `git grep` con el patrón de abajo: `git grep --untracked -n -E '<patrón>' -- ':(glob)specs/[0-9]*.md'` (`-l` en vez de `-n` si solo necesitas los nombres de archivo). Siempre con comillas simples: son literales en Bash, zsh y PowerShell, y las dobles alteran los backticks del patrón; si tu shell trata distinto las comillas simples, adapta el escape, no el patrón. Así se escribe igual en todas, y ya deja fuera `README.md`, `INDEX.md` y `archive/`. **Código de salida 1 sin salida significa 0 coincidencias, no un error:** no reintentes con otro patrón.
3. Nunca `cat`, `ls`, `grep`, `find`, `Select-String` ni `Get-Content` sueltos. Y estas búsquedas (specs, campos del header, secciones) las haces tú, en una sola llamada: **no las delegues a un subagente**. Su resultado ya es corto, así que delegar no ahorra contexto; solo suma tiempo, y el subagente no hereda estas reglas.

- **Specs del repo:** archivos del primer nivel de `specs/` cuyo nombre empieza con dígito (`AAAAMMDD-slug.md` o legacy `NN-slug.md`). Descarta `README.md`, `INDEX.md` y cualquier resultado bajo `specs/archive/`.
- **Campos del header** (`Estado`, `Área`, `Objetivo`…): un solo patrón para cualquier campo, cambiando la etiqueta: `^>?[[:space:]]*\*\*(.*\*\*)?(<etiqueta>):\*\*`. Por ejemplo, `^>?[[:space:]]*\*\*(.*\*\*)?(Estado|Status):\*\*`. Tolera el `> ` del blockquote, encuentra el campo esté al inicio o en medio de la línea y no atrapa menciones del campo en el cuerpo. Una sola búsqueda devuelve archivo y valor de todas a la vez. Si alguna spec no aparece (usa otro idioma en la etiqueta), lee solo sus primeras 8 líneas.
- **Secciones:** ubica `^## ` en el archivo y lee solo el rango de líneas que necesitas.

### Fase 0 — Triaje del pedido

**Ejecuta esto antes que cualquier otra cosa.** La mayoría de las malas specs son malas porque el pedido que las produjo era malo, y ninguno de los dos modos de fallo se anuncia solo: un pedido subespecificado parece una conversación interesante, y uno sobreespecificado parece una productiva.

Clasifica el pedido en exactamente uno de tres resultados. Usa las señales de abajo, no tu criterio — si una señal está presente, el resultado se dispara.

**Juzga esta fase solo a partir del texto del pedido.** Aquí no lees el repo: eso lo hace la Fase 1, y lee una cantidad acotada. Todo lo que esta fase decide, se decide por cómo está escrito el pedido.

**Cuando A y B podrían dispararse a la vez, gana A** — un pedido vago no se puede separar útilmente en problema y solución.

Ten en cuenta lo que esta fase **no** decide: si la feature merece una spec. Esa decisión es del dev, y ya la tomó al invocar este comando.

#### A — Subespecificado → detente y manda al usuario a definir el problema

Se dispara cuando **cualquiera** de estas señales está presente:

- Verbos exploratorios: "cómo podría…", "quiero mejorar…", "no estoy seguro si…", "ayúdame a pensar…", "qué opinas de…", "algo que haga…".
- No puedes escribir **un solo criterio de aceptación booleano** a partir de lo que dice el pedido.
- No puedes nombrar el estado de "antes" y "después" desde el punto de vista de quien usa el producto.
- El objetivo une con "y" dos comportamientos distintos y **alguno de los dos**, por separado, dispara una de las señales de arriba. (Si los dos están claros, el pedido no es vago, es grande: ver C.)

Nombra la señal que se disparó y detente:

> Me detengo aquí. [La señal, citada del pedido.] Una spec es un contrato, y no se puede escribir un contrato sobre algo que todavía no está decidido — si sigo, lo que sale es una lluvia de ideas disfrazada de spec, y la implementación improvisa el resto.
>
> Abre una sesión aparte y define ahí el problema — discútelo, decide cuál debe ser el comportamiento — y vuelve con el enunciado. Esa conversación vale la pena; simplemente no es una spec, y mezclar las dos es lo que produce una spec que nadie puede implementar.

**No ofrezcas continuar de todas formas. No propongas opciones de lo que podría ser la feature.** Ese es exactamente el fallo que esta fase existe para prevenir: en el momento en que empiezas a sugerir la feature, eres tú quien la decide, y no queda nadie para validar la decisión.

#### B — Sobreespecificado → no lo rechaces, sepáralo

Se dispara cuando el pedido contiene **cualquiera** de:

- Rutas de archivos existentes, o nombres de funciones, tipos, variables o componentes existentes.
- Pasos de implementación numerados.
- Fragmentos de código o diffs.
- Una librería, patrón o técnica impuesta, enunciada antes que el problema que resuelve.

No lo rechaces, y tampoco lo sigas. Devuelve el pedido en dos bloques y espera confirmación:

> **Problema** — lo que tomaré como enunciado:
> [El pedido reescrito como comportamiento observable. Sin nombres de archivos, sin nombres de funciones.]
>
> **Restricciones técnicas que mencionaste** — candidatas para la sección de Decisiones, no órdenes:
>
> - [Cada instrucción técnica, listada]
>
> ¿El problema está bien planteado? Si algo de lo de arriba es un requisito duro, dilo y entra en Decisiones como restricción impuesta.

Por qué importa: una spec cuyo enunciado ya contiene la solución no tiene nada que diseñar, así que nadie revisa nunca si la solución encaja con el problema. Separar ambos restaura esa revisión sin tirar lo que el usuario ya sabe.

Si el usuario insiste en que se haga exactamente como lo escribió, respétalo — y regístralo literalmente en la sección de Decisiones como `**Sí (impuesto por el dev):** … — motivo: …`. Una orden registrada como orden sigue siendo auditable; una orden disfrazada de decisión razonada no.

#### C — Bien formado → continúa a la Fase 1

El pedido plantea un problema o un comportamiento deseado, no dicta la implementación, y ya puedes escribir a partir de él al menos un criterio de aceptación booleano.

**Si une con "y" dos comportamientos que, cada uno por separado, son C**, no lo dividas aquí: dilo en una línea (`Corte candidato: <parte 1> / <parte 2>. Lo decide el control de tamaño.`) y continúa. La "y" dice dónde podría cortarse, no si conviene: eso depende de lo que cuesta cada parte, y esta fase solo ve cómo está escrito el pedido. "Listar pedidos y filtrarlos por fecha" es una spec; "perfil con cambio de contraseña" pueden ser dos aunque no lleve "y".

### Fase 1 — Entender el contexto

Antes de hacer preguntas sobre la feature, toma el contexto **del área que toca el pedido**, no de lo último que se escribió. Las specs se nombran por fecha: las dos más recientes casi nunca son las que describen el comportamiento que esta spec va a cambiar, y lo que sí lo describe puede estar repartido en una cadena de reemplazos (A → B → C) que nadie va a reconstruir leyendo por fecha.

El estado actual lo dicen el archivo de memoria, el doc vigente y el código. Las specs son historia: dicen por qué se decidió algo y qué quedó fuera, no cómo funciona hoy.

1. **Archivo de memoria del proyecto**, si existe. Intenta en orden y detente en el primero que encuentres: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`. Si tu agente ya lo cargó al iniciar la sesión, no lo releas. Ahí están las reglas del repo: qué comandos se pueden correr, cuáles son solo del dev, cómo se verifica el proyecto, dónde están los docs.
2. **`specs/README.md`**, si existe: la tabla de áreas (el vocabulario del campo `Área`, con el doc vigente de cada una). Si no existe, no lo crees: lo genera `/spec-impl` al cerrar la primera spec implementada.
3. **Clasifica el pedido** en 1 a 3 áreas de esa tabla y dilo en una línea antes de leer nada más: `Leo contexto de: facturacion, notificaciones.` Así el usuario corrige una mala clasificación antes de que se convierta en preguntas sobre el área equivocada. Si ningún área encaja, propón el nombre y la descripción de un área nueva y pregunta si se agrega a la tabla. Un área es un tema del producto, no una capa que toca todo (`ui`, `componentes`, `tests`): si el pedido es visual, su área es la de la pantalla o el flujo que cambia. Esa fila es lo **único** que esta skill puede escribir en `specs/README.md`, solo con confirmación y solo si el archivo ya existe.
4. **Doc vigente** de cada área, si tiene uno: solo la sección que toca el pedido, no el archivo entero. El doc dice cómo funciona hoy; las specs dicen cómo se llegó ahí.
5. **Specs vigentes** de esas áreas: tómalas de la fila de cada área en la tabla "Specs vigentes por área" de `specs/INDEX.md`, que ya descarta las reemplazadas enteras y las consolidadas en un doc, y marca las parciales. **Saca solo esas filas con una búsqueda** de `^\| <área> \|` en `INDEX.md`, por la vía del bloque **Lectura y búsqueda** (con `git grep`, la ruta es `-- specs/INDEX.md`), nunca leyendo `INDEX.md` entero: el resto del archivo es el historial completo y crece con cada spec. Si `INDEX.md` no existe, búscalas en los headers de `specs/` con la búsqueda de campos del bloque **Lectura y búsqueda** (`(Área|Area)`; no abras specs enteras para encontrarlas) y descarta las que tengan un `Superada por` sin la palabra `parcial` o un `Consolidada en` (lo que decidían ya está en el doc del paso 4). Para leer solo algunas secciones, sigue la regla de secciones del mismo bloque. Léelas de la más nueva hacia atrás (por el nombre del archivo; dentro de un mismo día, la que supera a otra es la más nueva), con un tope de 4 en total. Prioriza las que aparecen en más de una de tus áreas. De cada una lee solo el encabezado, las **Decisiones tomadas y descartadas** (lo que no se reabre) y lo que quedó **fuera de alcance** (lo diferido que este pedido puede retomar); el plan y los criterios son historia de su implementación. Una superada en parte se lee solo si necesitas justo la parte que sigue en pie; una reemplazada entera no se lee — es historia.
6. **Código que toca el pedido**: con una búsqueda de texto, ubica los puntos de entrada del área que el pedido va a cambiar y lee solo los fragmentos que necesitas, nunca módulos enteros. Es obligatorio si el área no tiene doc vigente; si el doc ya responde, es opcional. Si una spec o el doc contradicen al código, gana el código: dilo al usuario en una línea y llévalo como pregunta a la Fase 2.
7. Lo que leíste alimenta `Depende de` y `Supera a` del encabezado en la Fase 3. La forma de escribir la spec la da `template.md`, no las specs anteriores.

**Si no hay `specs/README.md` o su tabla de áreas está vacía, y ya hay specs** (un repo que todavía no adoptó las áreas): lista `specs/`, elige por título y objetivo las specs del tema del pedido —nunca por fecha— y sigue cada `Superada por` hasta la spec que ya no tiene uno. Dile al usuario en una línea que `/spec-areas` deja el repo con áreas (propone el vocabulario y lo asigna a las specs existentes), y sigue con esta spec sin esperar: la adopción es una sesión aparte. Si no hay ninguna spec todavía (ni siquiera la carpeta `specs/`), no hay nada que leer ni que adoptar: sigue a la Fase 2. En los dos casos, el `Área` de esta spec queda como propuesta en el header, para validarla cuando exista el vocabulario.

Si el argumento con que se invocó la skill (`$ARGUMENTS` en Claude Code) llega vacío, pide al usuario una descripción inicial **de una sola oración** de lo que quiere construir. Si la descripción no cabe en una oración, esa es la primera señal de que la feature es demasiado grande — sugiere dividirla antes de continuar.

### Fase 2 — Aclarar mediante preguntas

Esta es la fase más importante del comando. Tu trabajo aquí es **detectar ambigüedades y preguntar**, no asumir.

Haz preguntas en bloques de 3 a 5 a la vez (no una sola pregunta seguida de otra sola pregunta — eso agota). Después de cada bloque, espera respuesta antes de continuar.

**Si la Fase 0 marcó un corte candidato** (o ves uno ahora), el primer bloque pregunta solo lo que decide la división: qué entra en cada parte y de qué sistemas externos depende cada una (backend, IdP, terceros) y si eso está verificado. Así no preguntas en detalle por una parte que quizá no se escriba.

**Categorías de preguntas que siempre deberías considerar:**

- **Alcance:** ¿Qué entra y qué NO? ¿Qué partes de la feature se difieren a otra spec?
- **Datos:** ¿Qué estructuras nuevas se introducen? ¿Cómo se llaman? ¿Dónde viven?
- **Integración:** ¿Esta feature depende de specs previas? ¿Modifica algo existente o solo agrega?
- **Persistencia:** ¿Se guarda algo entre sesiones? ¿Dónde? ¿Con qué versionado?
- **UX y estados:** ¿Cómo se ve cuando funciona? ¿Cómo se ve cuando falla? ¿Hay estados intermedios?
- **Riesgos:** ¿Qué puede romper esto? ¿Qué pasa en el caso degradado?
- **Decisiones cerradas:** ¿Hay alguna decisión que el usuario ya tomó y no quiere reabrir?

**Cómo formular las preguntas:**

- Usa preguntas concretas, no abiertas. ❌ "¿Cómo imaginas la persistencia?" → ✅ "¿El progreso se guarda en memoria, en un archivo local o en una base de datos?"
- **Una decisión por número, sin sub-preguntas.** Si un punto esconde dos decisiones, son dos números: así el dev puede responder "1a, 2b, 3 como dices".
- Cuando la pregunta es una elección, da 2–4 opciones con letra ((a), (b)…), marca cuál es tu recomendación y por qué. Una pregunta que pide un dato (un nombre, una ruta) va sin opciones.
- Si detectas una respuesta que abriría la caja de Pandora (p. ej. "y además queremos multijugador"), señala que merece su propia spec y pregunta si la dejamos fuera del alcance de esta.

**Cuándo dejar de preguntar:**

Detente cuando puedas responder estas tres preguntas sin asumir nada:

1. ¿Qué archivos aparecerán o cambiarán?
2. ¿Cuál es el primer paso ejecutable y cuál es el último?
3. ¿Cómo verifico que la feature está terminada?

Si todavía no puedes responder alguna, sigue preguntando.

**Control de tamaño — mide antes de escribir una sola sección.**

Mide la feature al cerrar cada bloque de preguntas, no solo al final: dispárala en cuanto una fila sea verdadera, sin esperar a las demás. La fila de bloqueo suele conocerse desde el primer bloque; los pasos y los criterios, cuando ya puedes responder las tres preguntas de arriba. El control se dispara si **cualquier** fila es verdadera:

| Señal | Umbral |
| --- | --- |
| Partes del pedido que dependen de un supuesto externo sin verificar (backend, IdP, tercero) que otra parte no necesita | 1 o más |
| Pasos que va a tener el plan de implementación | más de 8 |
| Módulos del proyecto (unidad de código con frontera propia: módulo, paquete, feature, app) con **decisiones de diseño propias** (un módulo donde la spec solo aplica un patrón ya decidido en la misma spec no cuenta) | más de 2 |
| Dominios distintos con decisiones abiertas (estructura, estado, apariencia, sesión, red…) | más de 2 |
| Criterios de aceptación que va a tener | más de 20 |

Un cambio que aplica el mismo patrón en varios módulos cuenta como un solo módulo. El tamaño lo deciden los pasos, los criterios de aceptación y las decisiones abiertas, no cuántas carpetas se tocan, ni cuántas "y" tiene el pedido.

La fila de bloqueo existe porque juntas, la parte que no depende de nada queda detenida hasta que se verifique el supuesto de la otra: no se aprueba, no se verifica y no se cierra.

**Dónde se corta.** Cada parte tiene que valer como spec propia: al menos un criterio de aceptación booleano propio, y entregarla sin las demás no deja el producto roto. Busca el corte primero donde lo marcó la "y" o la fila de bloqueo. Si se pasa un umbral pero no hay un corte así entre comportamientos, corta en entregas incrementales del mismo comportamiento (p. ej. primero el caso feliz, después los estados de error).

Cuando se dispara, **no preguntes si dividir**. Presenta la división y pregunta cuál se escribe ahora:

> Esto no cabe en una spec: [la señal que se disparó, con su número]. Yo la dividiría así:
>
> | # | Objetivo (una oración) | Depende de |
> | --- | --- | --- |
> | 1 | … | — |
> | 2 | … | 1 |
>
> ¿Cuál escribimos ahora? El resto va a su sección "Fuera de alcance" para que no se pierda.

Contar antes de escribir es el punto central: una vez que las secciones existen, dividirlas se siente como tirar trabajo, y nadie lo hace.

### Fase 3 — Desarrollar la spec sección por sección

Lee ahora `template.md`. Una vez que tengas claridad, **no generes la spec completa de una sola vez**. Desarrollarás las secciones de la plantilla **una por una**, mostrando cada sección al usuario y esperando confirmación antes de pasar a la siguiente.

Orden estricto:

1. **Encabezado** (estado, dependencias, fecha, rama, área, supera a / superada por, objetivo en una oración). Todos los campos, con `—` donde estén vacíos — salvo `Área`, que lleva las áreas de la Fase 1 y nunca va vacío. `Rama` va en `—`: la llena `/spec-impl`. En los campos del encabezado las specs se citan por su ID en texto plano (el nombre del archivo sin `.md`), o como `SPEC NN` si son legacy; en la prosa, con un link que muestra el slug (`[slug](ID.md)`), como indica `template.md`. El objetivo no cita specs, y que quepa en una oración es crítico — si no cabe en una oración, vuelve a la Fase 2.
2. **Alcance** (qué entra y qué NO). El "no entra" debe ser explícito.
3. **Modelo de datos** (estructuras concretas con nombres reales). Si la feature no introduce datos nuevos, omite esta sección y dilo explícitamente.
4. **Supuestos externos** (qué se asume que hace el backend, el IdP o cualquier tercero, y si eso se verificó). Obligatoria siempre que el diseño se apoye en algo que no controlamos; se omite cuando no.
5. **Plan de implementación** (pasos numerados, cada uno dejando el sistema funcional).
6. **Criterios de aceptación** (checklist booleano, no aspiracional, cada uno marcado `(dev)` cuando solo el desarrollador puede ejecutarlo). Para decidir quién ejecuta cada uno, usa las herramientas de verificación que declare el archivo de memoria: un comando que su política permite al agente no se marca `(dev)`. Si no declara ninguna, dedúcelas del repo solo cuando sea claro (p. ej. un único script de test en el gestor de paquetes); si no lo es, pregunta al dev cómo se verifica antes de escribir la sección.
7. **Decisiones tomadas y descartadas** (con justificación breve). Se arma con las respuestas de la Fase 2. Las que tomaste tú, sin que salieran ahí, llevan `(propuesta)` al mostrarla: son las que el dev tiene que revisar. Esa marca no se escribe en el archivo.
8. **Riesgos identificados** (solo si aplica — si no hay riesgos relevantes, omítela). Cualquier supuesto que sostenga el diseño y siga sin verificar va aquí, con lo que pasa si resulta falso.

La sección **Desviaciones** del template no se escribe aquí: la agrega `/spec-impl` al cerrar la implementación.

**Cada sección es una ronda corta.** El dev tiene que leer todas, así que ninguna ronda junta dos secciones. Lo que se ahorra son las rondas sin nada que leer y lo que se repite:

- **Empieza con el avance:** `Sección 3/6 — Plan de implementación`. El total no cuenta las secciones omitidas.
- **Una sección omitida no tiene ronda propia.** Va como una línea al inicio de la siguiente (`Modelo de datos: se omite, no hay estructuras nuevas.`), y se confirma junto con ella.
- Muéstrala formateada en markdown.
- **Cierra con `Decidí sin preguntarte:`** y de 1 a 3 bullets con lo que elegiste sin que saliera en la Fase 2 (un nombre, una ruta, un orden). Si no hay nada, la línea no va. Así el dev sabe qué leer con cuidado y qué es solo lo que ya respondió.
- Pregunta: "¿Esta sección queda así o quieres ajustarla?"
- Si el usuario pide cambios, aplícalos y **muestra solo las líneas o ítems que cambiaron**. La sección entera, solo si el cambio la reestructura.
- Solo pasa a la siguiente sección cuando el usuario confirme.
- **La última sección termina con el nombre del archivo** (`Archivo: specs/<ID>.md`, ver Fase 4). Confirmar esa sección confirma también el nombre.

**Errores comunes a evitar:**

- Generar criterios de aceptación que no son verificables ("que funcione bien").
- Meter en el plan de implementación cosas que no están en el alcance.
- Asumir nombres de archivos o estructuras que el usuario no confirmó.
- Saltarse la sección de decisiones — esa es la sección con más valor a largo plazo.

### Fase 4 — Guardar la spec

El nombre se calcula antes de mostrar la última sección de la Fase 3, porque va al pie de ella. Se guarda cuando el usuario la confirma:

1. **El ID es `AAAAMMDD-slug`**: la fecha de hoy y un slug corto en kebab-case, sin tildes, a partir del objetivo (p. ej. `20261014-reintentos-de-pago`). **Nunca calcules un número secuencial**, aunque `specs/` tenga specs `NN-slug.md`: esas son legacy, y un contador es justo lo que choca entre devs y entre sesiones en paralelo.
2. Si `specs/<ID>.md` ya existe, no le agregues un sufijo (`-2`): propón otro slug que diga en qué se diferencia. Si en `specs/` ya hay una spec con el mismo slug y otra fecha, dilo en una línea: puede ser la misma feature escrita dos veces.
3. El nombre no tiene ronda propia: va en la línea `Archivo:` al pie de la última sección. Si el usuario confirma la sección pero cambia el nombre, usa el suyo (y repite el paso 2 con él).
4. Crea el archivo en `specs/<ID>.md` con todas las secciones aprobadas. Si la carpeta no existe, se crea al escribir el archivo. Justo antes de escribir, vuelve a comprobar que el archivo no exista (otra sesión pudo crearlo mientras tanto); si existe, vuelve al paso 2.
5. Marca el estado como `Borrador` por defecto (o su equivalente en el idioma del repo). **No lo marques como `Aprobado` automáticamente** — eso lo hace el usuario una vez que la haya releído, y `/spec-impl` se niega a implementar cualquier otra cosa.
6. Confirma al usuario:
   - Ruta del archivo creado.
   - Recordatorio: la spec está en estado `Borrador`. Cámbiala a `Aprobado` una vez que la hayas releído.
   - Siguiente paso: una vez revisada y aprobada, ejecuta `/spec-impl <ID>` (o solo el slug) para implementarla.
   - **Detente aquí.** No propongas implementar la spec, escribir código ni tomar ninguna acción más allá de esta confirmación.

## Reglas duras

- **Nunca escribas código durante este comando.** Solo el archivo `.md` de la spec al final.
- **Nunca propongas implementar la spec después de guardarla.** Tu trabajo termina cuando el archivo está escrito. El usuario ejecuta `/spec-impl` cuando esté listo.
- **Nunca asumas decisiones que el usuario no confirmó.** Si te falta información, pregunta.
- **Nunca generes la spec completa en una sola respuesta.** Sección por sección, con confirmación.
- **Si el usuario quiere acelerar y saltarse la Fase 2**, recuérdale: "Las preguntas de ahora ahorran horas después. ¿Seguro que quieres saltártelas?". Si insiste, respeta su decisión pero regístrala en la sección de decisiones de la spec ("Definición rápida sin aclaración detallada").
- **Si la feature es demasiado grande**, lo decide el control de tamaño al final de la Fase 2, con sus umbrales. No lo anules por intuición en ninguna dirección: los umbrales existen porque "esto parece grande" nunca se disparó en la práctica.
- **Nunca conviertas una detención por resultado A en una spec de todas formas.** Ni siquiera si el usuario lo pide dos veces: un pedido subespecificado no queda especificado porque se repita. La respuesta sigue siendo la sesión aparte — este comando no tiene nada que escribir hasta que el problema esté decidido.
- **Nunca regeneres el índice ni edites `specs/README.md` desde aquí.** Un borrador todavía no es un registro — el índice solo refleja specs que realmente se implementaron, y esa regeneración ocurre en la fase de cierre de `/spec-impl`, no aquí. La única excepción es agregar, con confirmación, una fila a la tabla de áreas (Fase 1).

## Tono al preguntar

Sé directo y específico. No te disculpes por preguntar. No uses frases como "si no te molesta..." o "¿podrías quizás...?". El usuario invocó esta skill precisamente porque quiere que le hagas preguntas. Usa preguntas concretas, una por línea cuando sean varias, y numéralas para que sean fáciles de responder.

Ejemplo de un bloque bien formado:

> Antes de escribir el modelo de datos necesito aclarar tres cosas:
>
> 1. **Persistencia.** ¿Dónde se guarda el progreso? (a) en memoria, (b) en un archivo local, (c) en una base de datos. Recomendación: (b), porque son pocos datos, de un solo usuario y sin consultas.
> 2. **Versionado del esquema.** ¿Qué pasa cuando cambia el formato? (a) prefijo de versión en la key, (b) ignorar y reconstruir, (c) migrar al cargar. Recomendación: (b) mientras no haya datos que valga la pena conservar.
> 3. **Cierre de sesión.** ¿Qué pasa con los datos al cerrar sesión? (a) se conservan, (b) se borran. Recomendación: (b) si son personales, porque el equipo puede ser compartido.

## Argumentos

Si el usuario invocó `/spec reintentos-de-pago`, usa `reintentos-de-pago` como sugerencia inicial de slug. Se confirma en la línea `Archivo:` de la última sección, como cualquier otro nombre.

Si invocó `/spec` sin argumentos, empieza pidiendo la descripción de una oración.
