#!/usr/bin/env node
// Gate for daily tribute files. Usage: node scripts/check-tributes.mjs [file ...]
// With no arguments every src/data/days/*.json is checked.
// Exit code 1 = at least one problem (nothing should be published).
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/data/days';
const BANNED = ['died','dead','death','deaths','killed','kill','murder','murdered','crash','crashed','fire','hit','fell','fall','victim','victims','body','bodies','funeral','lost','tragedy','tragic','autopsy','found','grieving','grief','mourning','mourn','suicide','accident','violence','violent','stabbed','shot','arrested','suspect','driver','investigation','police','carabinieri'];
const CAP_START_DATE = '2026-10-10'; // max 5 women per day from this date on
const MAX_WOMEN = 5;
const allow = new Set(
  fs.readFileSync('scripts/name-allowlist.txt', 'utf8').split('\n')
    .map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.toLowerCase())
);
const FIRST_NAMES = new Set('alessandro alessandra alberto andrea angelo anna antonella antonio arianna barbara beatrice bruno carla carlo carmela caterina chiara cinzia claudia claudio cristina daniela daniele davide elena eleonora elisa emanuele enrico enzo erica fabio fabrizio federica federico filippo francesca franco gabriele gabriella gianluca giancarlo gianni giorgia giorgio giovanna giovanni giulia giuseppe giuseppina ilaria irene laura lorenzo luca lucia luciana luigi luisa manuel manuela marco maria mariano marina mario marta martina massimo matteo mattia maurizio michela michele mirko monica nicola nicolo nicoletta paola paolo patrizia piero pietro riccardo roberta roberto rosa rosaria salvatore samuele sandra sara serena silvia simona simone stefania stefano tommaso valentina valeria vincenzo vittorio'.split(' '));

const problems = [];
const bad = (file, msg) => problems.push(`${path.basename(file)}: ${msg}`);

const files = process.argv.length > 2 ? process.argv.slice(2)
  : fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => path.join(DIR, f));

// slugs from ALL files, to catch duplicates
const seen = new Map();
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    for (const w of d.women || []) {
      const k = w.slug;
      if (seen.has(k) && seen.get(k) !== f) bad(f, `slug "${k}" also used in ${seen.get(k)}`);
      seen.set(k, f);
    }
  } catch { /* reported below */ }
}

const words = (s) => s.match(/[\p{L}'’]+/gu) || [];
const sentences = (s) => s.split(/(?<=[.!?])\s+/).filter(Boolean).length;

for (const file of files) {
  let d;
  try { d = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { bad(file, 'invalid JSON: ' + e.message); continue; }
  const base = path.basename(file, '.json');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(base)) bad(file, 'file name must be YYYY-MM-DD.json');
  if (d.date !== base) bad(file, `date field "${d.date}" does not match file name`);
  for (const k of ['title', 'intro']) if (typeof d[k] !== 'string' || !d[k].trim()) bad(file, `missing ${k}`);
  if (!Array.isArray(d.women) || !d.women.length) { bad(file, 'women[] missing or empty'); continue; }
  if (base >= CAP_START_DATE && d.women.length > MAX_WOMEN) bad(file, `${d.women.length} women, maximum is ${MAX_WOMEN}`);

  const visible = [d.title, d.intro];
  for (const w of d.women) {
    const id = w.slug || w.name || '?';
    for (const k of ['slug', 'name', 'town', 'region']) if (typeof w[k] !== 'string' || !w[k].trim()) bad(file, `${id}: missing ${k}`);
    if (!Array.isArray(w.tribute) || w.tribute.length < 1 || w.tribute.length > 3) bad(file, `${id}: tribute must have 1–3 paragraphs`);
    if (!Array.isArray(w.sources) || !w.sources.length) bad(file, `${id}: no source`);
    for (const s of w.sources || []) {
      if (!s.label || /https?:|www\./i.test(s.label)) bad(file, `${id}: source label must be plain text`);
      if (!/^https?:\/\//.test(s.url || '')) bad(file, `${id}: source url missing`);
    }
    const tribute = Array.isArray(w.tribute) ? w.tribute : [];
    const own = [w.name, w.town, w.region, ...(w.town || '').split(/[ ,]+/), ...(w.name || '').split(/ +/)].join(' ').toLowerCase();
    const ownWords = new Set(words(own));
    const texts = [...tribute, ...(w.example ? [w.example] : [])];
    visible.push(w.name, ...texts);

    // minors: age under 18 or a non-numeric age such as "4 months"
    const minor = (typeof w.age === 'number' && w.age < 18) || (typeof w.age === 'string' && w.age !== '');
    if (minor) {
      const n = tribute.reduce((a, p) => a + sentences(p), 0);
      if (n > 2) bad(file, `${id}: minor has ${n} sentences, maximum 2`);
      if (w.example) bad(file, `${id}: minor must not have an example`);
    }

    for (const t of texts) {
      if (/https?:|www\.|@/i.test(t)) bad(file, `${id}: link or address in text`);
      if (/\b(via|viale|piazza|corso|vicolo|largo|strada|street|road)\s+[A-Z0-9]/.test(t)) bad(file, `${id}: street address pattern`);
      if (/\d{5,}/.test(t)) bad(file, `${id}: long number in text`);
      // names of relatives / officials: known first names, titles, or "her <relative> <Capitalised>"
      for (const tk of words(t)) {
        const lw = tk.toLowerCase();
        if (FIRST_NAMES.has(lw) && !ownWords.has(lw) && !allow.has(lw)) bad(file, `${id}: possible first name "${tk}" (living relative or official?)`);
      }
      if (/\b(Don|Padre|Father|Dr|Dott|Dottor|Dottoressa|Mayor|Sindaco|Prof|Professor|Maresciallo|Colonel|Judge)\.?\s+\p{Lu}/u.test(t)) bad(file, `${id}: title followed by a name`);
      if (/\b(husband|wife|son|daughter|mother|father|brother|sister|partner|friend|priest|mayor|colleague)\s+(?:,\s*)?\p{Lu}\p{Ll}+/u.test(t)) bad(file, `${id}: relative followed by a capitalised word (a name?)`);
      if (/\b(works?|worked|employed|driver|colleague|company|employee)\b.*\b(for|with|at)\b/i.test(t) && /\b(her|his)\s+(son|daughter|husband|brother|sister|partner)\b/i.test(t)) bad(file, `${id}: workplace of a relative`);
      if (/\bmother of an? [a-z ]*(driver|worker|employee|officer|nurse|teacher)/i.test(t)) bad(file, `${id}: relative's job`);
    }
  }
  for (const t of visible) {
    for (const w of words(t.toLowerCase())) if (BANNED.includes(w)) bad(file, `banned word "${w}" in: ${t.slice(0, 60)}…`);
  }
}

if (problems.length) {
  console.error('TRIBUTE CHECK FAILED\n' + problems.map((p) => ' - ' + p).join('\n'));
  process.exit(1);
}
console.log(`Tribute check passed (${files.length} file(s)).`);
