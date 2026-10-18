import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const specsDir = path.join(process.cwd(), 'specs');
const readmePath = path.join(specsDir, 'README.md');
const indexPath = path.join(specsDir, 'INDEX.md');
const readmeTemplatePath = fileURLToPath(new URL('../assets/readme-template.md', import.meta.url));
// Una spec se llama `AAAAMMDD-slug.md`: el ID sale del reloj y del pedido, no de un contador, así que dos devs
// (o dos sesiones en paralelo) no pueden chocar. `NN-slug.md` es el formato legacy: se sigue indexando, nunca se crea.
const DATED_FILE_PATTERN = /^(\d{8})-(.+)\.md$/;
const LEGACY_FILE_PATTERN = /^(\d{1,7})-(.+)\.md$/;
// Versiones anteriores generaban estas tablas dentro de README.md; ahora viven solo en INDEX.md.
const LEGACY_GENERATED_MARKERS = [
  ['<!-- specs-by-area:start -->', '<!-- specs-by-area:end -->'],
  ['<!-- specs-index:start -->', '<!-- specs-index:end -->'],
];
const AREAS_MARKERS = ['<!-- specs-areas:start -->', '<!-- specs-areas:end -->'];
const INCOMPLETE = '⚠ header incompleto';
const UNKNOWN_AREA = '⚠ área desconocida';
const UNKNOWN_REF = '⚠ referencia desconocida';
const MISSING_DOC = '⚠ doc inexistente';

const FIELD_ALIASES = {
  status: ['status', 'estado'],
  branch: ['branch', 'rama'],
  area: ['area', 'área'],
  supersedes: ['supersedes', 'supera a'],
  supersededBy: ['superseded by', 'superada por'],
  consolidatedInto: ['consolidated into', 'consolidada en'],
  objective: ['objective', 'objetivo'],
};

function fieldKeyFor(label) {
  const normalized = label.trim().toLowerCase();
  return Object.entries(FIELD_ALIASES).find(([, aliases]) => aliases.includes(normalized))?.[0] ?? null;
}

// `Sesión` y `sesion` son la misma área: se compara sin tildes ni mayúsculas.
function normalizeArea(area) {
  return area
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '')
    .replaceAll('`', '')
    .trim()
    .toLowerCase();
}

const FIELD_LABEL_PATTERN = /\*\*[^*:]+:\*\*/;

// The header is made of one or more leading paragraphs that each contain at least one
// `**Label:**` marker (real fields, or unrecognized ones we'll just ignore). The first
// paragraph with none is prose (risk notes, "superseded by" callouts, etc.), not header — stop.
// Blockquote continuation lines that are just ">" count as a paragraph break too: some specs
// use them to separate an extra remark from the actual header inside the same blockquote.
function extractHeaderBlock(content) {
  const afterTitle = content.replace(/^#[^\n]*\n/, '');
  const plainText = afterTitle
    .split('\n')
    .map(line => line.replace(/^>\s?/, ''))
    .join('\n')
    .replace(/^(?:[ \t]*\n)+/, '');
  const paragraphs = plainText.split(/\n[ \t]*\n+/);
  const headerParagraphs = [];
  for (const paragraph of paragraphs) {
    if (!FIELD_LABEL_PATTERN.test(paragraph)) break;
    headerParagraphs.push(paragraph);
  }
  return headerParagraphs.join(' ').replaceAll('\n', ' ');
}

function parseFields(headerText) {
  const labelPattern = /\*\*([^*:]+):\*\*/g;
  const labelMatches = [...headerText.matchAll(labelPattern)];
  const fields = {};

  labelMatches.forEach((match, index) => {
    const key = fieldKeyFor(match[1]);
    if (!key) return;
    const valueStart = match.index + match[0].length;
    const valueEnd = labelMatches[index + 1]?.index ?? headerText.length;
    const value = headerText.slice(valueStart, valueEnd).replace(/·\s*$/, '').trim();
    fields[key] = value || null;
  });

  return fields;
}

// Las specs legacy llevan `# SPEC NN — Título`; las fechadas, solo `# Título`.
function extractTitle(content) {
  const titleLine = content.split('\n').find(line => line.startsWith('# '));
  if (!titleLine) return null;
  return titleLine.slice(2).replace(/^(?:SPEC|Spec)\s*\d+\s*[—:-]\s*/, '').trim();
}

function parseAreas(value) {
  if (!value || value === '—') return [];
  return value
    .split(',')
    .map(area => area.replaceAll('`', '').trim())
    .filter(Boolean);
}

// `Superada por` lista una o más specs, cada una con un "(parcial: …)" opcional, separadas por comas fuera de
// los paréntesis. Si alguna entrada no dice "parcial", esa spec quedó reemplazada entera y deja de ser vigente.
function splitReferences(value) {
  if (!value || value === '—') return [];
  const entries = [];
  let depth = 0;
  let current = '';
  for (const char of value) {
    if (char === '(') depth += 1;
    if (char === ')') depth = Math.max(0, depth - 1);
    if (char === ',' && depth === 0) {
      entries.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  entries.push(current);
  return entries.map(entry => entry.trim()).filter(Boolean);
}

function isFullySuperseded(supersededBy) {
  return splitReferences(supersededBy).some(entry => !/parcial|partial/i.test(entry));
}

// `Consolidada en` apunta a un doc, no a una spec: lo que la spec decidía ya vive ahí, así que deja de ser vigente
// aunque nadie la haya reemplazado. Acepta la ruta sola, entre backticks o como link, con una sección detrás
// (`docs/facturacion.md §3`): la ruta es lo que va antes del primer espacio, sin ancla.
function consolidationDocPath(consolidatedInto) {
  if (!consolidatedInto || consolidatedInto === '—') return null;
  const linkTarget = consolidatedInto.match(/\]\(([^)]+)\)/)?.[1];
  const raw = (linkTarget ?? consolidatedInto).replaceAll('`', '').trim();
  return raw.split(/\s/)[0].split('#')[0] || null;
}

function isCurrent(spec) {
  return !isFullySuperseded(spec.supersededBy) && !spec.consolidationDoc;
}

// Una referencia es el ID de la spec (`20261014-slug`) o, en specs legacy, `SPEC NN`.
function referenceToken(entry) {
  const dated = entry.match(/\b(\d{8}-[^\s(),.`]+)/)?.[1];
  if (dated) return { dated };
  const legacy = entry.match(/SPEC\s*(\d+)/i)?.[1];
  return legacy ? { legacy: Number.parseInt(legacy, 10) } : null;
}

function resolveReference(entry, specsById) {
  const token = referenceToken(entry);
  if (!token) return null;
  if (token.dated) return specsById.get(token.dated) ?? null;
  return [...specsById.values()].find(spec => spec.legacy && Number.parseInt(spec.label, 10) === token.legacy) ?? null;
}

function referenceLabel(entry, specsById) {
  const spec = resolveReference(entry, specsById);
  if (spec) return spec.label;
  const token = referenceToken(entry);
  const shown = token?.dated ?? (token ? `SPEC ${token.legacy}` : entry);
  return `${UNKNOWN_REF}: ${shown}`;
}

function supersedingLabels(supersededBy, specsById) {
  return splitReferences(supersededBy).map(entry => referenceLabel(entry, specsById));
}

function consolidationLabel(docPath) {
  return fs.existsSync(path.join(process.cwd(), docPath)) ? docPath : `${MISSING_DOC}: ${docPath}`;
}

function buildSupersessionCell(fields, consolidationDoc) {
  const parts = [];
  if (fields.supersedes && fields.supersedes !== '—') parts.push(`Sustituye ${fields.supersedes}`);
  if (fields.supersededBy && fields.supersededBy !== '—') parts.push(`Sustituida por ${fields.supersededBy}`);
  if (consolidationDoc) parts.push(`Consolidada en ${consolidationLabel(consolidationDoc)}`);
  return parts.length > 0 ? parts.join('<br>') : '—';
}

function buildAreaCell(areas, vocabulary) {
  if (areas.length === 0) return INCOMPLETE;
  return areas
    .map(area => (vocabulary && !vocabulary.has(normalizeArea(area)) ? `${UNKNOWN_AREA}: ${area}` : area))
    .join(', ');
}

// El ID es el nombre del archivo sin `.md`. Las legacy se muestran por su número, como siempre se citaron.
function parseFileName(fileName) {
  const id = fileName.slice(0, -'.md'.length);
  const dated = fileName.match(DATED_FILE_PATTERN);
  if (dated) return { id, label: id, slug: dated[2], day: dated[1], legacy: false };
  const legacy = fileName.match(LEGACY_FILE_PATTERN);
  return { id, label: legacy[1], slug: legacy[2], day: `legacy-${legacy[1]}`, legacy: true };
}

// Legacy primero, por número; después las fechadas, por ID (fecha, y dentro del día, slug).
function compareByName(a, b) {
  if (a.legacy !== b.legacy) return a.legacy ? -1 : 1;
  if (a.legacy) return Number.parseInt(a.label, 10) - Number.parseInt(b.label, 10);
  return a.id.localeCompare(b.id);
}

// Dentro de un mismo día el slug no dice cuál se escribió primero: la que supera a otra de ese día va
// después de ella, aunque su slug ordene antes. Fuera de eso, manda el nombre.
function assignOrder(specs, specsById) {
  const ordered = [];
  const placed = new Set();
  const visit = (spec, visiting) => {
    if (placed.has(spec) || visiting.has(spec)) return;
    visiting.add(spec);
    for (const entry of splitReferences(spec.supersedes)) {
      const older = resolveReference(entry, specsById);
      if (older?.day === spec.day) visit(older, visiting);
    }
    placed.add(spec);
    ordered.push(spec);
  };
  for (const spec of [...specs].sort(compareByName)) visit(spec, new Set());
  ordered.forEach((spec, position) => {
    spec.order = position;
  });
}

function compareSpecs(a, b) {
  return a.order - b.order;
}

function buildSpec(fileName, vocabulary) {
  const content = fs.readFileSync(path.join(specsDir, fileName), 'utf8').replaceAll('\r\n', '\n');
  const { id, label, slug, day, legacy } = parseFileName(fileName);
  const title = extractTitle(content) ?? INCOMPLETE;
  const fields = parseFields(extractHeaderBlock(content));
  const areas = parseAreas(fields.area);
  const consolidationDoc = consolidationDocPath(fields.consolidatedInto);

  return {
    fileName,
    id,
    label,
    slug,
    day,
    legacy,
    status: fields.status,
    areas,
    supersedes: fields.supersedes,
    supersededBy: fields.supersededBy,
    consolidationDoc,
    line: [
      label,
      `[${title}](${fileName})`,
      fields.objective ?? INCOMPLETE,
      buildAreaCell(areas, vocabulary),
      fields.status ?? INCOMPLETE,
      fields.branch ?? INCOMPLETE,
      buildSupersessionCell(fields, consolidationDoc),
    ].join(' | '),
  };
}

// Solo el primer nivel de `specs/` y solo archivos `AAAAMMDD-slug.md` o `NN-slug.md`: lo de `specs/archive/`,
// el README, el INDEX o cualquier otro `.md` sin ID no entra al índice.
function listSpecFiles() {
  return fs
    .readdirSync(specsDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && (DATED_FILE_PATTERN.test(entry.name) || LEGACY_FILE_PATTERN.test(entry.name)))
    .map(entry => entry.name);
}

// Mismo slug con distinto ID suele ser la misma feature escrita dos veces (dos devs, dos sesiones).
function warnRepeatedSlugs(specs) {
  const bySlug = new Map();
  for (const spec of specs) bySlug.set(spec.slug, [...(bySlug.get(spec.slug) ?? []), spec.fileName]);
  for (const [slug, files] of bySlug) {
    if (files.length > 1) console.log(`⚠ slug repetido "${slug}": ${files.join(', ')} — ¿es la misma feature?`);
  }
}

function isImplemented(spec) {
  if (!spec.status) return false;
  const statusLower = spec.status.toLowerCase();
  return ['implementado', 'implemented'].some(s => statusLower.includes(s));
}

function sliceBetween(text, [start, end]) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) return null;
  return text.slice(startIndex + start.length, endIndex);
}

function removeBetweenInclusive(text, [start, end]) {
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end);
  return `${text.slice(0, startIndex).trimEnd()}\n\n${text.slice(endIndex + end.length).trimStart()}`;
}

// El vocabulario de áreas lo declara cada repo, a mano, en una tabla `| Área | Qué cubre | Doc vigente |`
// entre los marcadores `specs-areas`. Sin esa tabla el script no valida áreas: devuelve null.
function readAreaVocabulary(readme) {
  const block = sliceBetween(readme, AREAS_MARKERS);
  if (block === null) return null;

  const vocabulary = new Map();
  const rows = block.split('\n').filter(line => line.trim().startsWith('|'));
  for (const row of rows.slice(2)) {
    const [name, , doc] = row
      .split('|')
      .slice(1, -1)
      .map(cell => cell.trim());
    if (name) vocabulary.set(normalizeArea(name), { name: name.replaceAll('`', ''), doc: doc || '—' });
  }
  return vocabulary;
}

function renderIndexTable(specs) {
  const header = '| ID | Nombre | Qué aporta | Área | Estado | Rama | Sustituye / Sustituida por / Consolidada en |';
  const separator = '| --- | --- | --- | --- | --- | --- | --- |';
  return [header, separator, ...specs.map(spec => `| ${spec.line} |`)].join('\n');
}

function specLink(spec) {
  return `[${spec.label}](${spec.fileName})`;
}

function describeCurrentSpec(spec, specsById) {
  const superseding = supersedingLabels(spec.supersededBy, specsById);
  if (superseding.length === 0) return specLink(spec);
  return `${specLink(spec)} (parcial → ${superseding.join(', ')})`;
}

function describeReplacedSpec(spec, specsById) {
  return `${specLink(spec)} → ${supersedingLabels(spec.supersededBy, specsById).join(', ')}`;
}

function describeConsolidatedSpec(spec) {
  return `${specLink(spec)} → ${consolidationLabel(spec.consolidationDoc)}`;
}

function groupSpecsByArea(specs) {
  const groups = new Map();
  for (const spec of specs) {
    for (const area of spec.areas) {
      const key = normalizeArea(area);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(spec);
    }
  }
  return groups;
}

// Una fila por área: las specs vigentes de la más nueva a la más vieja, para que una cadena de reemplazos
// se lea de un vistazo, y aparte las que otra spec reemplazó entera y las que ya viven en un doc.
// Una spec reemplazada entera y además consolidada cuenta como reemplazada: el reemplazo es lo que la sacó.
function renderAreaRow(name, doc, areaSpecs, specsById) {
  const newestFirst = [...areaSpecs].sort((a, b) => compareSpecs(b, a));
  const current = newestFirst.filter(isCurrent).map(spec => describeCurrentSpec(spec, specsById));
  const replaced = newestFirst
    .filter(spec => isFullySuperseded(spec.supersededBy))
    .map(spec => describeReplacedSpec(spec, specsById));
  const consolidated = newestFirst
    .filter(spec => spec.consolidationDoc && !isFullySuperseded(spec.supersededBy))
    .map(describeConsolidatedSpec);
  const cells = [current, replaced, consolidated].map(specs => specs.join(' · ') || '—');
  return `| ${name} | ${doc} | ${cells.join(' | ')} |`;
}

function renderAreaTable(specs, vocabulary, specsById) {
  const groups = groupSpecsByArea(specs);
  const rows = [];

  if (vocabulary) {
    for (const [key, { name, doc }] of vocabulary) rows.push(renderAreaRow(name, doc, groups.get(key) ?? [], specsById));
  }
  const unlisted = [...groups.keys()].filter(key => !vocabulary?.has(key)).sort((a, b) => a.localeCompare(b));
  for (const key of unlisted) {
    const name = groups.get(key)[0].areas.find(area => normalizeArea(area) === key);
    const label = vocabulary ? `${UNKNOWN_AREA}: ${name}` : name;
    rows.push(renderAreaRow(label, '—', groups.get(key), specsById));
  }

  const header = '| Área | Doc vigente | Specs vigentes (más nueva primero) | Reemplazadas enteras | Consolidadas en un doc |';
  const separator = '| --- | --- | --- | --- | --- |';
  return [header, separator, ...rows].join('\n');
}

const INDEX_HEADER = `# Índice de specs

> **Archivo generado** por el script \`specs-index.mjs\` de la skill \`spec\`, a partir del header de cada spec
> implementada. No se edita a mano: se pisa en la próxima regeneración. Si tiene un conflicto de merge, quédate
> con cualquiera de los dos lados y vuelve a correr el script. El vocabulario de áreas vive en \`README.md\`.
>
> \`${INCOMPLETE}\` señala un campo ausente en el header de esa spec; \`${UNKNOWN_AREA}\`, un \`Área\` que no
> está en la tabla de áreas; \`${UNKNOWN_REF}\`, un \`Superada por\` que no apunta a ninguna spec de \`specs/\`;
> \`${MISSING_DOC}\`, un \`Consolidada en\` que apunta a un archivo que no existe.`;

const BY_AREA_INTRO = `Una fila por área: las specs que siguen describiendo el comportamiento actual, de la más nueva a la más
vieja. \`(parcial → X)\` dice que la spec X reemplazó una parte; lo que no nombra esa parte sigue en pie.
"Reemplazadas enteras" ya no describen nada vigente — se leen solo por historia. "Consolidadas en un doc" tampoco
se leen: lo que decidían sigue vigente, pero ya está escrito en ese doc.`;

// Un repo nuevo no tiene `specs/README.md`: se crea desde la plantilla de la skill. Uno que ya lo tiene pero sin
// tabla de áreas la recibe al final. Uno de una versión anterior, con tablas generadas dentro, las pierde: ahora
// viven en INDEX.md, para que dos ramas que cierran specs no choquen en el archivo que se edita a mano.
function readReadme() {
  if (!fs.existsSync(readmePath)) {
    fs.copyFileSync(readmeTemplatePath, readmePath);
    console.log('📄 specs/README.md creado desde la plantilla.');
  }
  const original = fs.readFileSync(readmePath, 'utf8').replaceAll('\r\n', '\n');
  let readme = original;
  if (sliceBetween(readme, AREAS_MARKERS) === null) {
    const table = '| Área | Qué cubre | Doc vigente |\n| --- | --- | --- |';
    readme = `${readme.trimEnd()}\n\n## Áreas\n\n${AREAS_MARKERS[0]}\n\n${table}\n\n${AREAS_MARKERS[1]}\n`;
    console.log('➕ Tabla de áreas agregada a specs/README.md.');
  }
  for (const markers of LEGACY_GENERATED_MARKERS) {
    if (sliceBetween(readme, markers) === null) continue;
    readme = removeBetweenInclusive(readme, markers);
    console.log(`➖ Bloque ${markers[0]} quitado de specs/README.md (ahora vive en INDEX.md). Revisa si quedó un título vacío.`);
  }
  if (readme !== original) fs.writeFileSync(readmePath, readme);
  return readme;
}

function main() {
  fs.mkdirSync(specsDir, { recursive: true });

  const vocabulary = readAreaVocabulary(readReadme());
  const allSpecs = listSpecFiles().map(fileName => buildSpec(fileName, vocabulary));
  warnRepeatedSlugs(allSpecs);
  const specsById = new Map(allSpecs.map(spec => [spec.id, spec]));
  assignOrder(allSpecs, specsById);
  const specs = allSpecs.filter(isImplemented).sort(compareSpecs);

  const index = [
    INDEX_HEADER,
    '## Specs vigentes por área',
    BY_AREA_INTRO,
    renderAreaTable(specs, vocabulary, specsById),
    '## Índice',
    renderIndexTable(specs),
  ].join('\n\n');

  fs.writeFileSync(indexPath, `${index}\n`);
  console.log(`✅ specs/INDEX.md actualizado (${specs.length} specs).`);
}

main();
