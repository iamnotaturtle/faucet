import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/faucet/',
  build: {
    outDir: 'dist',
  },
  publicDir: 'public',
})

