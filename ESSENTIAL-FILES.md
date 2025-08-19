# Essential Files for Deployment

## Core Application Files (KEEP THESE):

- `package.json` - Dependencies and scripts
- `package-lock.json` - Exact dependency versions
- `tsconfig.json` - TypeScript configuration
- `src/` - All your source code
- `.do/app.yaml` - DigitalOcean deployment config
- `.env.production` - Production environment variables

## Important Documentation (KEEP):

- `README.md` - Project documentation
- `SUPABASE-DIGITALOCEAN-DEPLOYMENT.md` - Deployment guide

## Generated/Optional (OK to keep):

- `dist/` - Compiled JavaScript (auto-generated)
- `node_modules/` - Dependencies (auto-installed)

## Everything Else Can Go!

All the test files, debug scripts, migration files, etc. are just development artifacts and not needed for deployment.
