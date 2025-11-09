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

1. Build the project (see above)
2. Zip the entire contents of the `dist` folder
3. Go to your itch.io project page
4. Upload the zip file as an HTML5 game
5. Set the game to run `index.html` as the main file

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


