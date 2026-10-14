import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base must match the GitHub Pages repo path: https://revan-lombard.github.io/bride-vs-bride/
export default defineConfig({
  base: '/bride-vs-bride/',
  plugins: [react(), tailwindcss()],
})
