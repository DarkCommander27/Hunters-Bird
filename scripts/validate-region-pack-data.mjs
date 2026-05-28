import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const speciesDirectory = path.resolve(__dirname, '../src/data/regionPacks/species');
const allowedSeasonality = new Set(['spring', 'summer', 'fall', 'winter', 'year-round']);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertStringArray(value, fieldName, context, { allowEmpty = false } = {}) {
  assert(Array.isArray(value), `${context}: ${fieldName} must be an array.`);
  assert(allowEmpty || value.length > 0, `${context}: ${fieldName} must not be empty.`);

  value.forEach((entry, index) => {
    assert(isNonEmptyString(entry), `${context}: ${fieldName}[${index}] must be a non-empty string.`);
  });
}

function validateSpeciesRecord(species, packId, sourceFile, seenIds) {
  const context = `${sourceFile} (${species.id ?? 'unknown-id'})`;

  assert(species && typeof species === 'object' && !Array.isArray(species), `${sourceFile}: each entry must be an object.`);
  assert(isNonEmptyString(species.id), `${sourceFile}: species.id must be a non-empty string.`);
  assert(!seenIds.has(species.id), `${context}: duplicate species id "${species.id}" detected across pack files.`);
  seenIds.add(species.id);

  assert(isNonEmptyString(species.commonName), `${context}: commonName must be a non-empty string.`);
  assert(isNonEmptyString(species.scientificName), `${context}: scientificName must be a non-empty string.`);
  assert(isNonEmptyString(species.order), `${context}: order must be a non-empty string.`);
  assert(isNonEmptyString(species.family), `${context}: family must be a non-empty string.`);

  assertStringArray(species.habitats, 'habitats', context);
  assertStringArray(species.regions, 'regions', context);
  assertStringArray(species.states, 'states', context);
  assertStringArray(species.aliases, 'aliases', context, { allowEmpty: true });
  assertStringArray(species.seasonality, 'seasonality', context);

  assert(
    species.regions.includes(packId),
    `${context}: regions must include the owning pack id "${packId}".`,
  );

  species.seasonality.forEach((entry, index) => {
    assert(
      allowedSeasonality.has(entry),
      `${context}: seasonality[${index}] has invalid value "${entry}".`,
    );
  });

  if (species.description !== undefined) {
    assert(isNonEmptyString(species.description), `${context}: description must be a non-empty string when provided.`);
  }

  if (species.thumbnailUrl !== undefined) {
    assert(isNonEmptyString(species.thumbnailUrl), `${context}: thumbnailUrl must be a non-empty string when provided.`);
  }
}

async function main() {
  const files = (await readdir(speciesDirectory))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();

  assert(files.length > 0, 'No region pack species JSON files were found.');

  const seenIds = new Set();
  let totalSpecies = 0;

  for (const fileName of files) {
    const filePath = path.join(speciesDirectory, fileName);
    const raw = await readFile(filePath, 'utf8');
    const packId = path.basename(fileName, '.json');
    const species = JSON.parse(raw);

    assert(Array.isArray(species), `${fileName}: top-level JSON value must be an array.`);
    assert(species.length > 0, `${fileName}: species array must not be empty.`);

    species.forEach((entry) => validateSpeciesRecord(entry, packId, fileName, seenIds));
    totalSpecies += species.length;
  }

  console.log(`Validated ${files.length} region pack files with ${totalSpecies} species entries.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});