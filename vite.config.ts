import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

function cspPlugin(csp: string): Plugin {
  return {
    name: 'inject-csp',
    transformIndexHtml(html) {
      return html.replace('%%CSP%%', csp)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl    = env.VITE_BACKEND_URL ?? 'http://localhost:5075/api'
  const backendOrigin = new URL(backendUrl).origin

  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://media.petaverseapp.com",
    `connect-src 'self' ${backendOrigin} https://media.petaverseapp.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  return {
    plugins: [react(), tailwindcss(), cspPlugin(csp)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
