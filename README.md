VIGYAPAN Advertisement MASTER CMS

1. Replace Code.gs in the bound Apps Script project.
2. Run setupVigyapan() once. It creates/updates CMS sheets without deleting existing rows.
3. Deploy as Web App: Execute as Me, Who has access: Anyone.
4. Keep the /exec URL in config.js.
5. Replace GitHub Pages files with this package, including assets/.
6. Open admin.html and login. Default password on a fresh setup: admin123.

Important: this version uploads compressed media through authenticated GET/JSONP so GitHub Pages does not depend on cross-origin POST response handling. Uploaded media URLs are saved into the relevant CMS row/settings immediately.
