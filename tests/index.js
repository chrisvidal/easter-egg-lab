// Point d'entrée de `node --test tests/` : depuis Node 22, un dossier passé en argument est
// résolu comme un module (tests/index.js) au lieu d'être parcouru. Ce fichier charge donc
// chaque *.test.js. Sous Node 20, le dossier est parcouru et ce fichier n'est pas un test.
import { readdirSync } from 'node:fs';

const dir = new URL('./', import.meta.url);
for (const name of readdirSync(dir).filter((file) => file.endsWith('.test.js')).sort()) {
  await import(new URL(name, dir));
}
