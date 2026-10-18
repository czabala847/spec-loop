# Área sin doc vigente (`—`)

No fuerces lo aprendido en un doc ajeno. Si ya hay un doc del proyecto que cubre el área, propón asignárselo en la tabla de áreas. Si no lo hay, propón **crear** uno solo cuando el área cumpla las dos condiciones (lo normal es que no las cumpla):

1. **Pesa**, por cualquiera de estos dos motivos:
   - **Acumula:** tiene 5 o más specs vigentes en la tabla "Specs vigentes por área", contando esta, aunque sea de un solo módulo. `/spec` lee como mucho 4 specs vigentes por pedido: a partir de la quinta, las decisiones de las más viejas dejan de leerse, y el doc es lo que las rescata.
   - **Es transversal:** la usan o la condicionan otras áreas o buena parte de la app (autenticación y sesión, manejo de errores, multi-tenant, permisos…).
2. **No cabe en unas pocas líneas** del archivo de memoria del proyecto: si cabe, el destino es ese archivo, no un doc.

Como máximo **una** propuesta de doc nuevo por cierre, con el área, qué motivo de la condición 1 cumple y la ruta propuesta. Va como un ítem más de la lista numerada de 5.2.

La ruta se propone, nunca se asume una carpeta. En este orden, la primera que aplique:

1. Donde el archivo de memoria del proyecto dice que viven los docs.
2. Junto a los docs que ya tenga el repo.
3. Si el área corresponde a una sola carpeta de código (se llame como se llame), un doc dentro de esa carpeta.
4. Si no hay nada de lo anterior, `specs/areas/<área>.md`.

Si el usuario acepta, escríbelo a partir de lo que esta implementación dejó y de las specs vigentes del área: cómo funciona hoy, no cómo se llegó ahí, y las decisiones tomadas y descartadas que siguen en pie. Muéstralo antes de guardarlo y, con confirmación, llena la celda "Doc vigente" de esa área en la tabla de áreas.

En el mismo mensaje en que muestras el doc, debajo, lista las specs vigentes del área que quedan **consolidadas** en él, y las que no, cada una con su motivo en pocas palabras. Una spec queda consolidada solo si **todo** lo que `/spec` leería de ella está en el doc: sus decisiones tomadas y descartadas y lo que dejó fuera de alcance y sigue pendiente. Si le falta algo, queda vigente; lo normal es que la spec que estás cerrando quede vigente, por lo que dejó fuera de alcance. La misma confirmación del doc cubre las marcas: el usuario puede sacar specs de la lista. Con ella, agrega `**Consolidada en:** <ruta del doc>` al header de cada una, en la línea de `Supera a` / `Superada por`. El script del paso 5.4 las pasa a la columna "Consolidadas en un doc". Si no cumple los criterios, lo aprendido se queda en la sección "Decisiones" de la spec.
