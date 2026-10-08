import rss from '@astrojs/rss';
import { days, longDate } from '../data/site.js';

export function GET(context) {
  return rss({
    title: 'Love You Forever',
    description: 'A daily memorial for women across Italy.',
    site: context.site,
    items: days.map((d) => ({
      title: `${d.title}: ${longDate(d.date)}`,
      pubDate: new Date(d.date + 'T12:00:00Z'),
      description: d.intro,
      link: `/days/${d.date}/`,
    })),
  });
}
