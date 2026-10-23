import { mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
// Self-host the pinned Python runtime: no CDN dependency while practicing.
const source = fileURLToPath(new URL('.', import.meta.resolve('pyodide')));
const destination = fileURLToPath(new URL('../public/python/', import.meta.url));
await mkdir(destination, { recursive: true });
for (const file of ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
  await copyFile(join(source, file), join(destination, file));
}
console.log('Python runtime ready.');
