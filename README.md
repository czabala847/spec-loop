# spec-loop

Skills para trabajar con **spec-driven development** junto a un agente de IA: definir antes de codear, implementar contra un contrato y aprender de cada desviación.

Son independientes del lenguaje, del framework, del sistema operativo y del agente: funcionan en Claude Code, Codex, OpenCode, Antigravity y cualquier agente compatible con el formato `SKILL.md`.

## Por qué

Las reglas del proyecto (`AGENTS.md`, `CLAUDE.md`…) le dicen al agente *cómo* trabajar, pero no *qué* construir. Para eso suele quedar el prompt, y el prompt tiene dos problemas:

- **Se olvida.** Lo que se decidió en una feature anterior hay que volver a explicarlo, o esperar que el agente lo encuentre leyendo código.
- **Nadie lo compara con el resultado.** Si la implementación se desvía, no queda registro, y el mismo error se repite.

En spec-loop el agente escribe la spec leyendo el repo, implementa contra ella, anota en qué se desvió, y la spec queda en `specs/` como contexto para la siguiente. No es un prompt de un solo uso: es historia que se consulta.

## El ciclo

```
Por cada feature:   /spec ──► /spec-impl
                      ▲           │
                      └── specs/ ◄┘   (la spec cerrada es contexto de la siguiente)

Mantenimiento, cuando un aviso lo pide:
  /spec-areas       ordena el vocabulario de áreas (una vez al adoptar; después, revisión)
  /spec-consolidar  pasa al doc de un área lo que sus specs siguen decidiendo (y le crea uno si le hace falta)
  /spec-retro       mejora las skills a partir de las desviaciones
```

| Skill | Qué hace |
| --- | --- |
| `spec` | Hace triaje del pedido, pregunta lo que falta y escribe la spec sección por sección en `specs/`. No escribe código. |
| `spec-impl` | Implementa una spec **Aprobada** en su rama, paso a paso o de corrido (`--auto`), y la cierra: criterios, memoria del proyecto, desviaciones y estado. |
| `spec-areas` | Adopta o reorganiza el vocabulario de áreas, para que `/spec` lea el contexto por tema y no por fecha. |
| `spec-retro` | Junta las desviaciones de las specs cerradas y propone cambios a las skills cuando una causa se repite. |
| `spec-consolidar` | Pone al día el doc de un área con el código (corrige lo desactualizado y poda lo que el código ya dice), y después marca las specs que ese doc ya cubre, para que `/spec` lea solo lo que el doc no dice. Si el área no tiene doc, decide si le hace falta uno y, solo entonces, lo escribe validado contra el código. |

**Cómo se arma el contexto.** Antes de preguntar, `/spec` lee del área del pedido el doc vigente (cómo funciona hoy) y hasta 4 specs vigentes (qué se decidió y qué quedó pendiente). Las specs que ya están escritas en el doc se marcan `Consolidada en` y dejan de leerse, así esas 4 son las que dicen algo que el doc no dice. Al cerrar, si un área junta 5 o más specs vigentes, `/spec-impl` avisa que corras `/spec-consolidar`, tenga doc o no. Un doc nuevo solo nace si el área lo justifica: antes se prefiere un doc existente o una sección de uno.

## Cuándo usarlo

Para features que tocan lógica que vas a querer recordar después. Un fix de una línea o un cambio de texto no necesitan spec: pídeselo al agente directamente.

Cuánto revisar lo decides tú. `/spec` siempre pregunta, pero cada pregunta trae una opción recomendada y cada sección te dice qué decidió sin preguntarte: puedes leer todo con calma o aceptar lo recomendado. Lo que no cambia: la spec queda en `Borrador` hasta que tú la pasas a `Aprobado`, y `/spec-impl` no implementa otra cosa.

## Requisitos

- **git**: las skills leen ramas y estado del repo.
- **Node.js**: `spec` incluye `scripts/specs-index.mjs`, que regenera `specs/INDEX.md`. No tiene dependencias.

## Instalación

Con el CLI de [skills.sh](https://skills.sh) (usa `npx` o el equivalente de tu gestor: `pnpm dlx`, `bunx`…):

```bash
# En el proyecto actual, para los agentes que elijas
npx skills add czabala847/spec-loop

# Para agentes concretos
npx skills add czabala847/spec-loop -a claude-code -a codex -a opencode -a antigravity

# Global (disponible en todos tus proyectos)
npx skills add czabala847/spec-loop -g

# Solo algunas skills
npx skills add czabala847/spec-loop --skill spec --skill spec-impl
```

El CLI instala cada skill donde la busca cada agente y, por defecto, usa symlinks a una única copia.

### Actualizar

```bash
npx skills update
```

Las skills instaladas son una copia: **no las edites en el proyecto**, porque la próxima actualización pisa el cambio. Los ajustes propios de un repo van en su archivo de memoria (`AGENTS.md`, `CLAUDE.md`…); las mejoras generales, en este repo.

## Configurar el proyecto

Las skills no asumen ningún stack. Lo que necesitan del proyecto lo leen de su **archivo de memoria**, el primero que exista de `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`:

- Qué comandos puede correr el agente y cuáles son solo del dev.
- Cómo se verifica el proyecto: lint, tipos, tests (completos y focalizados).
- Cómo obtener diagnósticos del IDE, si hay forma.
- Dónde están los docs.

Ejemplo mínimo:

```md
## Verificación de código

- Comandos permitidos al agente: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test:run`.
- Tests focalizados: `pnpm exec vitest run <ruta>`.
- Solo del dev: `pnpm db:push`, cualquier deploy.
```

Si el archivo no dice cómo se verifica, las skills deducen la herramienta solo cuando es obvia; si no, preguntan.

## Uso

```
/spec reintentos de pago        → specs/20261014-reintentos-de-pago.md (Borrador)
                                  (lo relees y lo cambias a Aprobado a mano)
/spec-impl reintentos-de-pago   → rama, implementación, cierre
/spec-retro                     → cuando /spec-impl avise que hay ~10 specs sin retro
/spec-consolidar login          → cuando /spec-impl avise que un área tiene 5+ specs vigentes
```

En agentes sin comandos con `/`, pídele que use la skill por su nombre (por ejemplo, "usa la skill spec-impl con reintentos-de-pago").

Campos como `disable-model-invocation` o `allowed-tools` en el frontmatter son de Claude Code; los demás agentes los ignoran sin problema.

## Créditos

Inspirado en [fernando-skills](https://github.com/Klerith/fernando-skills) de Fernando Herrera (MIT). `spec` y `spec-impl` partieron de esa idea y fueron reescritas para este flujo; `spec-areas`, `spec-retro` y `spec-consolidar` son nuevas.

## Licencia

[MIT](LICENSE)
