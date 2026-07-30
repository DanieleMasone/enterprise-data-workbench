import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname } from 'node:path';

const source = 'dist/index.html';
const destination = 'dist/guide/index.html';

const sourceEntry = await stat(source).catch(() => undefined);
if (!sourceEntry?.isFile()) {
  throw new Error(`Expected Vite application entry: ${source}`);
}

await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
