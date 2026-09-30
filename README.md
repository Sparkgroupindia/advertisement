VIGYAPAN CMS FINAL

1. Paste Code.gs into the bound Google Sheet Apps Script and deploy as Web App (Execute as Me / Anyone).
2. Put the /exec URL in config.js.
3. Upload all files except Code.gs to GitHub Pages. assets/ may be kept for the included demo content.
4. Run setupVigyapan() only once on a fresh sheet. Existing data is preserved.

Admin: /admin.html
Default password: admin123

Important: after changing Code.gs, Deploy > Manage deployments > Edit > New version > Deploy.

Changes in this version:
- Added working POST transport for save/upload/delete operations.
- Added logo upload and logoUrl setting.
- Gallery is grouped into customer-facing folders by Section.
- Folder opens into a carousel viewer with image zoom and video playback.
- Gallery bulk upload asks for folder/section and uploads up to 4 files in parallel.
- Image <=150 KB and video <=500 KB bypass compression.
- Larger media is compressed in the browser before upload.
- Live per-file upload status is shown in the same upload panel.
- Public site polls only the version every 5 seconds and renders only when changed.
- Login and CMS loading are non-blocking after authentication.
