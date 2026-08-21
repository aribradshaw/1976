import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ATTRIBUTE_PATTERN = /<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["'][^>]*>/gi;

export function collectStaticReferences(html) {
  return [...html.matchAll(ATTRIBUTE_PATTERN)]
    .map((match) => match[1].trim())
    .filter((reference) => reference.length > 0)
    .filter((reference) => !/^(?:[a-z]+:|\/\/|#)/i.test(reference));
}

function assertRelativeReference(reference) {
  if (reference.startsWith('/')) {
    throw new Error(`Root-relative asset path is not portable: ${reference}`);
  }
}

function assertInsideDirectory(filePath, directory) {
  const resolvedDirectory = resolve(directory);
  const resolvedFile = resolve(filePath);
  const directoryPrefix = `${resolvedDirectory}${sep}`;

  if (resolvedFile !== resolvedDirectory && !resolvedFile.startsWith(directoryPrefix)) {
    throw new Error(`Asset path escapes the package directory: ${resolvedFile}`);
  }
}

export function verifyLocalPackage(indexPath = resolve('dist', 'index.html')) {
  const resolvedIndex = resolve(indexPath);
  const packageDirectory = resolve(resolvedIndex, '..');

  if (!existsSync(resolvedIndex)) {
    throw new Error(`Static entrypoint does not exist: ${resolvedIndex}`);
  }

  const html = readFileSync(resolvedIndex, 'utf8');
  const references = collectStaticReferences(html);

  if (references.length === 0) {
    throw new Error(`No local script or stylesheet references found in ${resolvedIndex}`);
  }

  for (const reference of references) {
    assertRelativeReference(reference);
    const cleanReference = reference.split(/[?#]/, 1)[0];
    const assetPath = fileURLToPath(new URL(cleanReference, pathToFileURL(resolvedIndex)));
    assertInsideDirectory(assetPath, packageDirectory);

    if (!existsSync(assetPath) || !statSync(assetPath).isFile() || statSync(assetPath).size === 0) {
      throw new Error(`Referenced asset is missing or empty: ${reference}`);
    }
  }

  return { indexPath: resolvedIndex, references };
}

export async function verifyRemotePackage(indexUrl) {
  const response = await fetch(indexUrl, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Static entrypoint returned HTTP ${response.status}: ${indexUrl}`);
  }

  const html = await response.text();
  const references = collectStaticReferences(html);

  if (references.length === 0) {
    throw new Error(`No local script or stylesheet references found at ${indexUrl}`);
  }

  for (const reference of references) {
    assertRelativeReference(reference);
    const assetUrl = new URL(reference, response.url).toString();
    const assetResponse = await fetch(assetUrl, { redirect: 'follow' });

    if (!assetResponse.ok) {
      throw new Error(`Referenced asset returned HTTP ${assetResponse.status}: ${assetUrl}`);
    }
  }

  return { indexUrl: response.url, references };
}

async function main() {
  const urlArgument = process.argv.find((argument) => argument.startsWith('--url='));
  const result = urlArgument
    ? await verifyRemotePackage(urlArgument.slice('--url='.length))
    : verifyLocalPackage(process.argv[2]);

  const target = 'indexUrl' in result ? result.indexUrl : result.indexPath;
  console.log(`Static package verified: ${result.references.length} assets reachable from ${target}`);
}

const isCommandLine = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCommandLine) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
