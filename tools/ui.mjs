// Automação simples do emulador via ADB + uiautomator.
//   node tools/ui.mjs dump                 -> lista elementos com texto/descrição e centro (x,y)
//   node tools/ui.mjs tap "Entrar"         -> toca no 1º elemento cujo texto/descrição contém "Entrar"
//   node tools/ui.mjs type "Nome" "Ana"    -> toca no campo e digita
//   node tools/ui.mjs shot nome            -> screenshot em docs/screenshots/nome.png
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ADB = join(process.env.ANDROID_HOME || 'C:\\Android\\Sdk', 'platform-tools', 'adb.exe');
const adb = (...args) => execFileSync(ADB, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function dump() {
  adb('shell', 'uiautomator', 'dump', '/sdcard/ui.xml');
  const xml = adb('exec-out', 'cat', '/sdcard/ui.xml');
  const nodes = [];
  for (const m of xml.matchAll(/<node [^>]*>/g)) {
    const n = m[0];
    const attr = (k) => (n.match(new RegExp(` ${k}="([^"]*)"`)) || [])[1] ?? '';
    const b = attr('bounds').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!b) continue;
    const [x1, y1, x2, y2] = b.slice(1).map(Number);
    nodes.push({
      text: attr('text').replace(/&#10;/g, ' '),
      desc: attr('content-desc'),
      cls: attr('class'),
      x: Math.round((x1 + x2) / 2),
      y: Math.round((y1 + y2) / 2),
    });
  }
  return nodes;
}

function find(label, { exact = false } = {}) {
  const nodes = dump();
  const match = (s) => (exact ? s === label : s.toLowerCase().includes(label.toLowerCase()));
  const hit = nodes.find((n) => match(n.desc) || match(n.text));
  if (!hit) throw new Error(`Elemento não encontrado: "${label}"`);
  return hit;
}

const escapeText = (s) => s.replace(/ /g, '%s').replace(/([()&|;<>'"`$\\*?])/g, '\\$1');

const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'dump') {
  for (const n of dump()) if (n.text || n.desc) console.log(`${JSON.stringify(n.text)} ${JSON.stringify(n.desc)} (${n.x},${n.y}) ${n.cls.split('.').pop()}`);
} else if (cmd === 'tap') {
  const n = find(a);
  adb('shell', 'input', 'tap', String(n.x), String(n.y));
  console.log(`tap "${a}" em (${n.x},${n.y})`);
} else if (cmd === 'type') {
  // Toca no EditText logo abaixo do rótulo `a` (ou no próprio elemento se for campo) e digita `b`.
  const nodes = dump();
  const i = nodes.findIndex((n) => (n.text + ' ' + n.desc).toLowerCase().includes(a.toLowerCase()));
  if (i < 0) throw new Error(`Rótulo não encontrado: "${a}"`);
  const field = nodes.slice(i).find((n) => n.cls.endsWith('EditText'));
  if (!field) throw new Error(`Campo após "${a}" não encontrado`);
  adb('shell', 'input', 'tap', String(field.x), String(field.y));
  await sleep(1200); // teclado abrir + layout reajustar antes de digitar
  // Limpa o conteúdo atual (vai ao fim e apaga).
  adb('shell', 'input', 'keyevent', 'KEYCODE_MOVE_END');
  adb('shell', 'input', 'keyevent', ...Array(40).fill('KEYCODE_DEL'));
  for (const word of b.split(/(\s)/)) {
    if (word === ' ') adb('shell', 'input', 'keyevent', 'KEYCODE_SPACE');
    else if (word) adb('shell', 'input', 'text', escapeText(word));
    await sleep(150);
  }
  console.log(`digitou em "${a}"`);
} else if (cmd === 'shot') {
  const out = join(ROOT, 'docs', 'screenshots', `${a || 'tela'}.png`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, execFileSync(ADB, ['exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 }));
  console.log(out);
} else {
  console.log('uso: node tools/ui.mjs dump | tap <texto> | type <rótulo> <valor> | shot <nome>');
}
