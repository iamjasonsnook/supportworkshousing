# SupportWorks Housing Website

A React single-page application built with Vite for SupportWorks Housing, a nonprofit organization dedicated to providing housing support services.

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Deployment

This project uses separate staging and production branches with automated GitHub Pages deployment:

### Branches

- **`production`** - Production environment (clean, DNS-ready)
  - Deploys to: `https://iamjasonsnook.github.io/supportworkshousing/`
  - Base path: `/` (configured for custom domain)
  - Auto-deploys on push via `.github/workflows/deploy-production.yml`

- **`staging`** - Testing and experimentation
  - Deploys to: `https://iamjasonsnook.github.io/supportworkshousing/staging/`
  - Base path: `/supportworkshousing/staging/`
  - Auto-deploys on push via `.github/workflows/deploy-staging.yml`

### Workflow

1. **Development**: Make changes in feature branches
2. **Testing**: Merge to `staging` branch to test on staging site
3. **Production**: When ready, merge `staging` to `production` for live deployment

### Custom Domain Setup

To point your custom domain to production:
1. Add a CNAME record pointing to `iamjasonsnook.github.io`
2. Configure custom domain in GitHub repository settings
3. Production branch is configured with base path `/` for clean URLs

## Tech Stack

- React 19.2.0
- Vite 7.2.4
- React Router DOM
- Lucide React (icons)
