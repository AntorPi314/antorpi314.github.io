import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration
// IMPORTANT: `base: './'` uses relative paths for all built assets.
// This is critical for GitHub Pages, since the site is served from a
// sub-path like https://username.github.io/repo-name/ instead of the
// domain root. Using an absolute base ('/') would break asset loading.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
