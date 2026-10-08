import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://love-you-forever.libanje.com',
  integrations: [sitemap()],
  trailingSlash: 'always',
});
