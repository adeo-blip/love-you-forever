// Loads every daily file in src/data/days/ and returns days (newest first) and a flat list of tributes.
const files = import.meta.glob('./days/*.json', { eager: true });

export const days = Object.values(files)
  .map((m) => m.default ?? m)
  .sort((a, b) => b.date.localeCompare(a.date));

export const tributes = days.flatMap((d) =>
  d.women.map((w) => ({ ...w, day: d.date, dayTitle: d.title }))
);

export const dedication = (name) =>
  name.startsWith('A ')
    ? 'Every life carries light. We honour her and keep her memory with love.'
    : `Every life carries light. We honour ${name.split(' ')[0].replace(/"/g, '')} and keep her memory with love.`;

export const longDate = (iso) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// "76 · Town, Region" — age is optional (some names and ages are not published)
export const metaLine = (w) => [w.age, `${w.town}, ${w.region}`].filter((x) => x !== null && x !== undefined && x !== '').join(' · ');
