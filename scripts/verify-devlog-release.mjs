import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const releases = JSON.parse(readFileSync(resolve(root, 'config/devlog-releases.json'), 'utf8'));
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

if (!Array.isArray(releases) || releases.length === 0) {
  throw new Error('DevLog release registry must contain at least one release.');
}

const seenVersions = new Set();
for (const release of releases) {
  if (!semver.test(String(release.version ?? ''))) {
    throw new Error(`Invalid DevLog version: ${release.version}`);
  }
  if (seenVersions.has(release.version)) {
    throw new Error(`Duplicate DevLog version: ${release.version}`);
  }
  seenVersions.add(release.version);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(release.date ?? ''))) {
    throw new Error(`Invalid DevLog date for ${release.version}.`);
  }
  if (!String(release.title ?? '').trim() || !Array.isArray(release.notes) || release.notes.length === 0) {
    throw new Error(`DevLog release ${release.version} needs a title and release notes.`);
  }
}

if (packageJson.version !== releases[0].version) {
  throw new Error(`package.json ${packageJson.version} does not match latest DevLog ${releases[0].version}.`);
}

console.log(`DevLog release ${packageJson.version} verified.`);

