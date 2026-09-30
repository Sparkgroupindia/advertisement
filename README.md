# VIGYAPAN Professional Website CMS — Master Edition

## Architecture
- GitHub Pages: public website + admin panel on the same domain
- `index.html`: public website
- `admin.html`: master admin panel
- Google Apps Script: API/CMS
- Google Sheet: content database
- Google Drive: uploaded media

## Main improvements
- Reliable admin save/delete/upload flow using Apps Script POST without browser preflight problems.
- Logo upload from Admin > Brand & Settings; logo appears in public header and footer.
- Google Maps embed URL controlled from Admin > Brand & Settings.
- Testimonials are now CMS-managed through a `TESTIMONIALS` sheet.
- Gallery image/video filters and lightbox navigation.
- Clickable service cards with detail modal + WhatsApp enquiry.
- Floating WhatsApp button and improved contact controls.
- Responsive mobile-first public website and redesigned master admin dashboard.
- Existing HERO, SERVICES, PRODUCTS, PLANS and GALLERY sheets remain compatible.
- Existing content is preserved; setup adds missing CMS structures instead of replacing rows.

## One-time Apps Script update
1. Open the Google Apps Script project connected to the CMS Sheet.
2. Replace `Code.gs` with this package's `Code.gs`.
3. Save.
4. Run `setupVigyapan()` once from the Apps Script editor.
5. Approve permissions if Google asks.
6. Deploy > Manage deployments > Edit the existing Web App deployment.
7. Keep Execute as: Me, and Who has access: Anyone.
8. Deploy the new version.
9. Keep the same `/exec` URL in `config.js` unless Google generated a new deployment URL.

## GitHub Pages update
Upload/replace these files in the existing `advertisement` repository:
- `index.html`
- `app.js`
- `style.css`
- `admin.html`
- `admin.js`
- `admin.css`
- `config.js`

Do not remove the existing `assets` folder or other repository files if they are present.

## Admin
Open:
`https://sparkgroupindia.github.io/advertisement/admin.html`

First setup default password remains `admin123` only if the Sheet is being initialized for the first time. Change it from Admin > Brand & Settings after login.
