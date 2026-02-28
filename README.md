# SupportWorks Housing Website

A React single-page application built with Vite for SupportWorks Housing, a nonprofit organization dedicated to providing housing support services.

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run unit tests
```

## Deployment

The site is deployed on **Vercel** with automatic deployments from the `main` branch.

- **Production URL:** https://supportworkshousing.org
- **Vercel preview:** https://supportworkshousing.vercel.app

API endpoints are Vercel serverless functions located in the `api/` directory. For local development, `npm run admin` starts an Express server that mirrors the production API.

## Tech Stack

- React 19
- Vite 7
- React Router DOM
- Lucide React (icons)
- Stripe (payments)
- Supabase (database)
- EmailJS (transactional email)
