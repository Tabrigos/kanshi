// Writes the generated token files. The logic lives in tokens.mjs.

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildTokenFiles, root } from './tokens.mjs';

for (const file of await buildTokenFiles()) {
  await writeFile(path.join(root, file.destination), file.output);
  console.log(`wrote ${file.destination}`);
}
