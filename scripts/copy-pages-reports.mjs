import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname } from 'node:path';

const reports = [
  ['coverage', 'dist/coverage'],
  ['docs', 'dist/docs'],
];

async function assertDirectoryExists(path) {
  const entry = await stat(path).catch(() => undefined);
  if (!entry?.isDirectory()) {
    throw new Error(`Expected generated report directory: ${path}`);
  }
}

for (const [source, destination] of reports) {
  await assertDirectoryExists(source);
  await mkdir(dirname(destination), { recursive: true });
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true });
}
