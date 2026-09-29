# VIGYAPAN Advertisement CMS

## Updated setup
This package fixes the CMS upload/login/live-update flow.

### 1. GitHub
Upload/replace these files in the existing repository:
- `index.html`
- `style.css`
- `app.js`
- `config.js`
- `admin.html`
- `admin.css`
- `admin.js`

Keep any existing repository asset files/folders as they are.

### 2. Google Apps Script
Open the Apps Script project connected to **VIGYAPAN Website CMS** and replace the complete contents of `Code.gs` with the `Code.gs` from this ZIP.

Then create a **new Web App deployment version**:
- Execute as: **Me**
- Who has access: **Anyone**
- Deploy a new version
- Copy the new `/exec` URL into `config.js` if the URL changes.

Do not create a second spreadsheet. The existing sheet/data is used.

### 3. Upload behavior
- Images are compressed in the browser before upload (target around 120 KB, with a safe API payload limit).
- Videos are converted to compact WebM in Chrome/Edge when the browser supports MediaRecorder.
- Uploaded files are stored in the existing `VIGYAPAN_MEDIA` Drive folder.
- Admin waits for a verified server result, then saves the media URL into the Sheet.
- Public website checks for CMS version changes every **5 seconds**.
- Public website also uses a browser cache so repeat visits render existing content immediately while fresh data loads in the background.

### 4. Admin login
Wrong password stays on the login page and shows a visible error. A valid session is required before the dashboard is displayed.

Default password on a fresh setup: `admin123`.

### 5. Important
After changing `Code.gs`, the old Apps Script deployment will continue using the old backend until a new deployment/version is deployed. The GitHub files alone cannot update the Apps Script backend.
