# Specs

Cada spec es un archivo `specs/AAAAMMDD-slug.md`: la fecha en que se escribió y un slug corto. El nombre del
archivo sin `.md` es su **ID**, y es como se la cita en cualquier otra spec o doc (`Supera a: 20261014-slug`).
No hay numeración secuencial: varias personas, o varias sesiones en paralelo, pueden crear specs sin chocar.

El índice (specs vigentes por área y la lista de specs implementadas) está en [`INDEX.md`](INDEX.md). Lo genera
el script `specs-index.mjs` de la skill `spec`: no se edita a mano, y si tiene un conflicto de merge se vuelve a
correr el script.

## Áreas

El vocabulario cerrado del campo `Área` de las specs. **Esta tabla sí se edita a mano**: un área nueva se
agrega aquí antes de usarla en una spec. "Doc vigente" es el doc del proyecto que describe cómo funciona hoy
esa área (o `—` si ninguno lo hace); `/spec` lo lee antes que las specs y `/spec-impl` lleva ahí lo que el
área aprende.

<!-- specs-areas:start -->

| Área | Qué cubre | Doc vigente |
| --- | --- | --- |

<!-- specs-areas:end -->
