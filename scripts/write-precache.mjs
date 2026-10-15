import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=(await readdir('dist/assets')).filter(n=>/\.(js|css|png)$/.test(n)).sort().map(n=>'/assets/'+n);
const source=await readFile('public/sw.js','utf8');
const hash=createHash('sha256').update(source+files.join('|')).digest('hex').slice(0,12);
await writeFile('dist/sw.js',source.replace("const CACHE='vb-fit-shell-v1';",`const CACHE='vb-fit-shell-${hash}';\nconst PRECACHE=${JSON.stringify(files)};`).replace("cache.addAll(['/','/manifest.webmanifest','/icon-192.png','/icon-512.png'])","cache.addAll(['/','/manifest.webmanifest','/icon-192.png','/icon-512.png',...PRECACHE])"));
console.log(`PWA: ${files.length} static assets included in offline shell.`);
