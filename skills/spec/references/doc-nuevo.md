# Área sin doc vigente (`—`)

Este es el criterio para darle doc a un área que no lo tiene. Lo aplica `/spec-consolidar`; `/spec-impl` y `/spec-areas` solo avisan. Un doc es caro: `/spec` lo lee antes de cada spec del área, y cada doc nuevo es uno más que mantener al día con el código. Por eso lo normal es que un área **no** tenga doc propio.

## Antes de crear: buscar uno que ya exista

Si un doc del proyecto ya describe el área, o una sección de uno (`docs/catalogo.md §4`), propón asignárselo en la celda "Doc vigente" de la tabla de áreas de `specs/README.md`. No nace ningún archivo, y desde ahí el área se consolida como cualquier otra con doc. Los docs del proyecto son los que nombra el archivo de memoria; si no nombra ninguno, los de la carpeta de documentación del repo.

## Los cuatro filtros

En orden. Si el área no pasa uno, no hay doc nuevo: dilo con el filtro que falló, y lo aprendido sigue en las specs.

1. **Pesa**, por cualquiera de estos dos motivos:
   - **Acumula:** tiene 5 o más specs vigentes en la tabla "Specs vigentes por área" de `specs/INDEX.md`, aunque sea de un solo módulo. `/spec` lee como mucho 4 specs vigentes por pedido: a partir de la quinta, las decisiones de las más viejas dejan de leerse, y el doc es lo que las rescata.
   - **Es transversal:** la usan o la condicionan otras áreas o buena parte de la app (autenticación y sesión, manejo de errores, multi-tenant, permisos…).
2. **No cabe en unas pocas líneas** del archivo de memoria del proyecto: si cabe, el destino es ese archivo, no un doc.
3. **No cabe como sección** de un doc que ya existe. Si el área es vecina de otra que tiene doc (p. ej. `precios` junto al doc de `catálogo`), propón una sección nueva ahí antes que un archivo nuevo, y asígnale esa sección.
4. **Se paga solo.** Si el área entró por **acumular**, el doc tiene que permitir marcar `Consolidada en` en suficientes specs para que su fila baje de 5 vigentes; si no, `/spec` seguiría perdiendo specs y solo se suma lectura. Este filtro se mide con el veredicto por spec, después de escribir el borrador. Un área **transversal** no lo necesita: su doc vale por las áreas que la usan, no por sus propias specs.

## Dónde va

La ruta se propone, nunca se asume una carpeta. En este orden, la primera que aplique:

1. Donde el archivo de memoria del proyecto dice que viven los docs.
2. Junto a los docs que ya tenga el repo.
3. Si el área corresponde a una sola carpeta de código (se llame como se llame), un doc dentro de esa carpeta.
4. Si no hay nada de lo anterior, `specs/areas/<área>.md`.

## Qué lleva

Cómo funciona hoy el área y por qué no de la forma obvia: las trampas, las decisiones tomadas y descartadas que siguen en pie, y lo que quedó fuera de alcance y sigue pendiente. Nunca cómo se llegó ahí (para la historia están las specs), ni lo que el código ya dice solo. Los hechos de un sistema externo van con su fecha de verificación; un supuesto sin verificar, solo marcado como tal.

## Las marcas

Al mostrar el doc, lista debajo las specs vigentes del área que quedan **consolidadas** en él y las que no, cada una con su motivo en pocas palabras. El criterio es el del campo `Consolidada en` en `template.md` (`../template.md`, relativo a este archivo): todo lo que `/spec` leería de la spec y sigue en pie tiene que estar en el doc. La misma confirmación del doc cubre las marcas y la celda "Doc vigente": el usuario puede sacar specs de la lista.
