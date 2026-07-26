# Misthi Maheshwari — Portfolio

## What's inside
- `index.html` — the public portfolio (dark/light toggle, top-right).
- `admin.html` — password-protected editor. Default password: `admin123` (change it inside the admin page — "Change admin password").
- `content.json` — all your data. The site reads this file; the admin page edits it.
- `style.css`, `script.js`, `admin.css`, `admin.js` — code, no need to touch.

## Run it locally
Browsers block `content.json` from loading when you just double-click `index.html`
(a `file://` restriction, not a bug). Serve the folder instead:

```
python3 -m http.server 8000
```
then open `http://localhost:8000`.

## Put it online (so it's visible to everyone)
Drag-and-drop this whole folder onto **Netlify Drop** (netlify.com/drop), or push it to
**GitHub Pages** / **Vercel**. Any static host works — no backend needed. You already
have a Netlify portfolio URL, so you can redeploy there.

## How editing works
1. Open `yoursite.com/admin.html`, log in.
2. Edit anything — name, links, experience, projects, add/remove entries, attach any
   link you want under **Links & tags → Custom links**.
3. Changes save instantly to *your browser* and preview live if you reopen the site
   in the same browser (click **Open live preview**).
4. To make changes visible to **everyone** (not just your browser), click
   **Publish (download content.json)**, then re-upload/replace that one file in your
   hosting (drag it into Netlify Drop again, or commit it to GitHub). That's the whole
   update — no rebuild needed.

## Notes
- The admin password is a simple client-side lock — fine for keeping casual visitors
  out, not bank-grade security. Don't put anything truly sensitive behind it.
- "Reset to published" discards local browser edits and reloads the last `content.json`.
- "Import JSON" lets you load a previously exported `content.json` back into the editor.
