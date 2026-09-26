import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Matches CORS_ORIGINS in nestjs-crm-backend/.env
    // 5174 is in a Windows-reserved TCP port exclusion range (Hyper-V/WSL NAT),
    // which makes Vite fail with EACCES on some machines.
    port: 5273,
    strictPort: true,
    host: true,
  },
})
