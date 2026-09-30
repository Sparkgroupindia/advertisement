# VIGYAPAN Professional Website CMS

## Architecture
- GitHub Pages: public website + admin panel on the SAME domain
- `index.html`: public website
- `admin.html`: admin panel
- Google Apps Script: API/CMS
- Google Sheet: content database
- Google Drive: uploaded media

## Setup
1. Create a new blank Google Sheet.
2. Extensions > Apps Script.
3. Paste `Code.gs`.
4. Run `setupVigyapan()` once and approve permissions.
5. Deploy > New deployment > Web app.
   - Execute as: Me
   - Who has access: Anyone
6. Copy the `/exec` URL.
7. Open `config.js` and replace:
   PASTE_APPS_SCRIPT_EXEC_URL_HERE
   with your `/exec` URL.
8. Upload all files/folders to a GitHub repository.
9. Enable GitHub Pages from the repository's main branch/root.

## Same GitHub link
Public:
https://YOUR-USERNAME.github.io/YOUR-REPO/

Admin:
https://YOUR-USERNAME.github.io/YOUR-REPO/admin.html

## First admin password
admin123

Change it from Admin > Site Settings after login.

## Live updates
The public website polls the Google Apps Script API every 5 seconds. When you save from Admin, the public page picks up the change automatically without a manual refresh.

## Media
Images are resized/compressed in the browser before upload. Video compression uses MediaRecorder/WebM when the browser supports it. Actual final video size depends on duration, motion and browser codec support.

## Important
Keep the Apps Script URL only in `config.js`. Do not put your Google Sheet ID or Drive folder ID in the public HTML.
