import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use '/' for Vercel, '/supportworkshousing/' for GitHub Pages
  base: process.env.VERCEL ? '/' : (process.env.VITE_BASE_PATH || '/supportworkshousing/'),
})
