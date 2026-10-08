# Love You Forever

Static memorial site (Astro) for https://love-you-forever.libanje.com. Built by Patapo AI.

## Add a day
Create `src/data/days/YYYY-MM-DD.json` (copy the structure of an existing file). Pages, archive, RSS and sitemap are generated automatically.

### Tribute rules (apply to every entry)
- Only facts documented by a published source. Never invent qualities, quotes or relationships.
- No cause or circumstances of death, no words such as died, killed, crash, fire, found dead, victim.
- Never name, hint at or blame any suspect, driver or investigation. No photos or news screenshots.
- Unnamed women stay unnamed ("A woman from <town>"). Never give street addresses.
- If nothing positive is documented, keep the tribute to name, age, town, and the generic dedication.
- Every entry lists its sources (JSON keeps label + url for the editor's records; the site shows only the labels, not links, by owner's decision). Remove any page on a clear request from a relative within 48 hours.

## Build
```
npm install
npm run build      # output in dist/
npm run dev        # local preview
```

## Deploy (Cloudflare Pages, free)
1. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git > pick this repo.
2. Production branch: `main`. Build command: `npm run build`. Output directory: `dist`. Node 22.
3. Custom domain: add `love-you-forever.libanje.com` and create the CNAME record Cloudflare shows at the DNS provider of libanje.com.
4. Daily content goes to a `draft` branch. Cloudflare gives it a private preview URL. Merge `draft` into `main` to publish.

## Ads (Google AdSense)
Ads are off. After Google approves the site, set `PUBLIC_ADSENSE_CLIENT` (ca-pub-...) and optionally `PUBLIC_ADSENSE_SLOT_HOME` / `PUBLIC_ADSENSE_SLOT_ARTICLE` in Cloudflare Pages environment variables, add `public/ads.txt` with the line Google gives you, and redeploy. The consent banner appears automatically once an ad client is set.
