import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import Papa from 'papaparse';
import { parseCSV } from '../lib/data.mjs';
const input=process.argv[2];
if(!input) { console.error('Usage: npm run prepare:csv -- data/cdc.csv'); process.exit(1); }
try {
  const rows=parseCSV(await readFile(resolve(input),'utf8'));
  await mkdir('public/data',{recursive:true});
  const csv=Papa.unparse(rows);
  await writeFile('public/data/places.csv',csv+'\n');
  console.log(`Prepared ${rows.length} observations in public/data/places.csv. Import this same file into Supabase if desired.`);
} catch(error) {console.error(error.message);process.exitCode=1;}
