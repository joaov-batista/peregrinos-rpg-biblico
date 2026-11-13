import { defineConfig } from 'vite';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

// O worker instala uma versão quando o essencial dela está no aparelho; a narração vem depois, sem travar a atualização.
let outputDir = 'dist';
export default defineConfig({
  plugins: [{
    name: 'peregrinos-offline',
    apply: 'build',
    configResolved(config) { outputDir = config.build.outDir; },
    async closeBundle() {
      const root = outputDir, files = [];
      async function walk(dir) {
        for (const e of await readdir(dir, { withFileTypes: true })) {
          const path = join(dir, e.name);
          if (e.isDirectory()) await walk(path);
          else if (e.name !== 'sw.js') files.push(path);
        }
      }
      await walk(root); files.sort();
      const hash = createHash('sha256');
      const template = await readFile('public/sw.js', 'utf8'); hash.update(template);
      for (const file of files) { hash.update(file); hash.update(await readFile(file)); }
      const urls = files.map(f => '/' + relative(root, f).replaceAll('\\', '/'));
      const id = hash.digest('hex').slice(0, 16);
      await writeFile(join(root, 'sw.js'), template
        .replace('__BUILD_ID__', id)
        .replace('/* PRECACHE */ []', JSON.stringify(urls)));
      // a página pergunta por este arquivo (sem cache) para saber se saiu versão nova, mesmo que o worker trave
      await writeFile(join(root, 'version.json'), JSON.stringify({ id }));
    }
  }]
});
