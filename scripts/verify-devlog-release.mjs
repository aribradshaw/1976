import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertDevLogReleaseAlignment } from '@aribradshaw/devlog';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const releases = JSON.parse(readFileSync(resolve(root, 'config/devlog-releases.json'), 'utf8'));
const previousPackage = readPreviousPackage();
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

assertDevLogReleaseAlignment({
  currentVersion: packageJson.version,
  latestDevLogVersion: releases[0].version,
  dependencyVersion: packageJson.dependencies?.['@aribradshaw/devlog'],
  previousVersion: previousPackage?.version,
  previousDependencyVersion: previousPackage?.dependencies?.['@aribradshaw/devlog'],
});

console.log(`DevLog release ${packageJson.version} verified.`);

function readPreviousPackage() {
  const candidates = [process.env.GITHUB_EVENT_BEFORE, 'HEAD^']
    .filter((value) => value && !/^0+$/.test(value));
  for (const revision of candidates) {
    try {
      return JSON.parse(execFileSync('git', ['show', `${revision}:package.json`], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }));
    } catch {
      // A shallow checkout may not have a parent. Version-to-registry alignment still runs.
    }
  }
  return null;
}

