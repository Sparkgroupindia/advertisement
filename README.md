# VIGYAPAN — Full Professional Website + CMS

## Files
- `index.html` — public website
- `admin.html` — admin panel on the same GitHub Pages domain
- `app.js`, `style.css` — public website
- `admin.js`, `admin.css` — CMS
- `config.js` — Apps Script `/exec` URL
- `Code.gs` — Google Apps Script backend (paste into Apps Script only)
- `assets/` — ready demo media; replace everything from Admin after setup if desired

## Setup
1. Open the Google Sheet used for the CMS.
2. Extensions → Apps Script.
3. Replace the complete `Code.gs` with the `Code.gs` in this ZIP.
4. Run `setupVigyapan()` once and approve permissions.
5. Deploy → New deployment → Web app → Execute as Me → Anyone.
6. Keep the `/exec` URL in `config.js`.
7. Upload all GitHub files/folders except `Code.gs`.
8. Enable GitHub Pages.

## URLs
Public: `https://YOUR-USER.github.io/YOUR-REPO/`
Admin: `https://YOUR-USER.github.io/YOUR-REPO/admin.html`

## Admin login
First setup password: `admin123`.
The admin token is kept only in page memory. Refreshing `admin.html` returns to the login page.

## Media
- Images <= 150 KB: direct upload, no compression.
- Images > 150 KB: browser compression before upload.
- Videos <= 500 KB: direct upload, no compression.
- Videos > 500 KB: browser WebM compression when supported.
- Up to 4 media files upload in parallel.
- Each file shows Preparing / Compressing / Uploading / Uploaded / Failed status.
- Gallery uploads are stored in Drive subfolders by gallery section.

## Gallery
Admin Gallery / Video is folder based. Create a folder name and upload multiple images/videos. Public visitors see equal-size folder cards. Clicking a folder opens a viewer with previous/next navigation, image zoom and video controls.

## Live update
The public website checks the CMS version every 5 seconds. It only downloads the full CMS data when the version changes. A built-in fallback demo keeps the public page visible immediately even if the API is slow or temporarily unavailable.
