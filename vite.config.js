import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

// Plugin to run Vercel-style API handlers locally during development
function vercelApiPlugin() {
  return {
    name: 'vercel-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();

        const apiName = req.url.replace('/api/', '').split('?')[0];
        const apiPath = path.resolve(
          fileURLToPath(import.meta.url),
          '..',
          'api',
          `${apiName}.js`
        );

        try {
          // Clear module cache for hot reloading
          const mod = await import(`${apiPath}?t=${Date.now()}`);
          const handler = mod.default;

          // Parse JSON body for POST requests
          if (req.method === 'POST') {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            req.body = JSON.parse(Buffer.concat(chunks).toString());
          }

          // Parse query params
          const url = new URL(req.url, `http://${req.headers.host}`);
          req.query = Object.fromEntries(url.searchParams);

          // Mock Vercel response helpers
          const originalEnd = res.end.bind(res);
          res.status = (code) => { res.statusCode = code; return res; };
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json');
            originalEnd(JSON.stringify(data));
          };
          res.send = (data) => originalEnd(data);

          await handler(req, res);
        } catch (err) {
          console.error(`API error (${apiName}):`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (including non-VITE_ ones) into process.env for API handlers
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), vercelApiPlugin()],
    // Use '/' for Vercel, '/supportworkshousing/' for GitHub Pages
    base: process.env.VERCEL ? '/' : (process.env.VITE_BASE_PATH || '/supportworkshousing/'),
  };
})
