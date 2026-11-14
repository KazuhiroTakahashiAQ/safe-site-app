// 現行React版からデータを抽出して data.json を作る（単一HTML版の生成用）
import { readFileSync, writeFileSync } from 'node:fs';
import { TRADES, CASES, SAMPLE_PHOTOS } from '../src/qualityData.js';

const appJsx = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

function extractLiteral(src, marker) {
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`marker not found: ${marker}`);
  const arrStart = src.indexOf('[', start);
  let depth = 0;
  for (let i = arrStart; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) return src.slice(arrStart, i + 1);
    }
  }
  throw new Error('unbalanced brackets');
}

const accidents = eval(`(${extractLiteral(appJsx, 'const ACCIDENTS =')})`);
const schedule = eval(`(${extractLiteral(appJsx, 'const SCHEDULE =')})`);

const data = { TRADES, CASES, SAMPLE_PHOTOS, ACCIDENTS: accidents, SCHEDULE: schedule };
writeFileSync(new URL('./data.json', import.meta.url), JSON.stringify(data, null, 1));
console.log(
  `accidents=${accidents.length} schedule=${schedule.length} cases=${CASES.length} photos=${SAMPLE_PHOTOS.length}`,
);
