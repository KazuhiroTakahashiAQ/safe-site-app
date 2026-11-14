// template.html + data.json → ../index.html（単一ファイル版アプリ）
import { readFileSync, writeFileSync } from 'node:fs';

const tpl = readFileSync(new URL('./template.html', import.meta.url), 'utf8');
const data = readFileSync(new URL('./data.json', import.meta.url), 'utf8');
if (!tpl.includes('/*__DATA__*/')) throw new Error('placeholder not found');
const html = tpl.replace('/*__DATA__*/{}', data.trim());
writeFileSync(new URL('../index.html', import.meta.url), html);
console.log('index.html written:', html.length, 'bytes');
