Automatic Vercel deployment

This repository is configured to deploy to Vercel automatically on push to the `main` branch using the workflow in `.github/workflows/vercel-deploy.yml`.

What you need to do in the GitHub repository settings:

1. Go to Settings -> Secrets -> Actions and add a repository secret named `VERCEL_TOKEN` with a Vercel Personal Access Token (read/write) created from https://vercel.com/account/tokens.

Optional: If you prefer the official GitHub Action integrations for Vercel or to target Preview deployments only, update the workflow accordingly and add `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` secrets.

Manual deploy (from a machine with the Vercel token):

1. In a terminal, set the token as an environment variable (do not commit this):
   - Windows PowerShell: `$env:VERCEL_TOKEN = 'YOUR_TOKEN'`
2. Run: `npx vercel --prod --confirm --token $env:VERCEL_TOKEN`.

Notes:
- The project uses Vite and outputs the production build into `dist/`. `vercel.json` instructs Vercel to use the static builder and rewrite all routes to `index.html` so client-side routing works.
- The GitHub Action runs `npm ci` then `npm run build` before calling `vercel`.
