# Deployment Guide

## Building for Production

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

This creates a `dist` folder with all production-ready files.

## Deploying to itch.io

The live project is `aribradshaw/1976`. Use itch.io's official Butler uploader so releases are incremental and versioned.

1. Build and verify the project.
   ```bash
   npm run build
   npm run verify:static
   ```
2. Authenticate once with `butler login`.
3. Push the built directory as the HTML5 channel:

```bash
butler push dist aribradshaw/1976:html5 --userversion 2.7.13
```

4. In the itch.io edit page, mark only the current `html5` Butler upload as **This file will be played in the browser**, hide superseded manual ZIP uploads, and save.
5. Verify the public game at `https://aribradshaw.itch.io/1976` in both desktop and mobile layouts.
6. Verify the exact public iframe and all of its entrypoint assets:

```bash
npm run verify:static -- --url=https://html-classic.itch.zone/html/UPLOAD-BUILD/index.html
```

Use `butler status aribradshaw/1976:html5` to confirm the processed build and displayed version.

## Deploying to HostGator

1. Build the project (see above)
2. Connect to your HostGator server via FTP or cPanel File Manager
3. Navigate to your public directory (usually `public_html` or `www`)
4. Upload all files from the `dist` folder
5. Ensure `index.html` is in the root of your public directory

### Important Notes for HostGator

- The build uses relative paths, so it should work in any subdirectory
- If you want to host it in a subdirectory (e.g., `/1976/`), make sure the `base` in `vite.config.ts` is set correctly
- For React Router compatibility (if you add routing later), you may need to configure `.htaccess` to redirect all routes to `index.html`

### .htaccess for React Router (Optional)

If you add routing later, create a `.htaccess` file in your public directory:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Testing the Build Locally

Before deploying, test the production build locally:

```bash
npm run preview
```

This serves the `dist` folder and lets you verify everything works correctly.

## File Structure After Build

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── vite.svg (if you have it)
```

All files in `dist` should be uploaded to your server.


