# Kaiken Alku

A personal website / home-screen app: **Diary, Calendar, To-do, Goals and Dreams**, reached from one lobby.
Forest green, brown and black, minimal and modern. Built for iPhone, works in any browser.

- No accounts, no server. Everything is saved on your device (browser storage).
- Works offline once it has been opened.
- Settings (top-right in the lobby): your name, **Export / Import backup**, erase data.

## Put it on your iPhone

1. On GitHub open this repo → **Settings → Pages**.
2. Under *Build and deployment* choose **Deploy from a branch**, pick the branch with this code and folder **/ (root)**, then **Save**.
   (GitHub Pages on a private repo needs a paid plan — make the repo public if Pages isn't offered.)
3. After a minute the site is at `https://<your-username>.github.io/<repo-name>/`.
4. Open that link in **Safari** → tap **Share** → **Add to Home Screen**.

It now opens full-screen with its own icon, like a normal app.

> Your data lives in that home-screen app on that phone. Use **Export backup** in Settings now and then so you never lose it.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page shell |
| `styles.css` | The look (colours are at the top as variables) |
| `app.js` | All the logic: lobby, sections, storage |
| `sw.js` | Offline support |
| `manifest.webmanifest`, `icons/` | Home-screen app name and icons |

To change the colours, edit the variables at the top of `styles.css` (`--forest`, `--bark`, `--tan`, …).
