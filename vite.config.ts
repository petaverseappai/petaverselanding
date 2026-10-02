import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import fs from 'fs'

function cspPlugin(csp: string): Plugin {
  return {
    name: 'inject-csp',
    transformIndexHtml(html) {
      return html.replace('%%CSP%%', csp)
    },
  }
}

function wellKnownPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'generate-well-known',
    apply: 'build',
    resolveId(id) {
      if (id.endsWith('/.well-known/assetlinks.json')) {
        return '\0virtual:assetlinks.json'
      }
      if (id.endsWith('/.well-known/apple-app-site-association')) {
        return '\0virtual:aasa.json'
      }
      return null
    },
    load(id) {
      if (id === '\0virtual:assetlinks.json') {
        const androidSha256 = env.VITE_ANDROID_SHA256
        if (androidSha256) {
          const assetlinks = [
            {
              relation: ['delegate_permission/common.handle_all_urls'],
              target: {
                namespace: 'android_app',
                package_name: 'com.petaverse.app',
                sha256_cert_fingerprints: [androidSha256],
              },
            },
          ]
          return JSON.stringify(assetlinks, null, 2)
        }
        return ''
      }
      if (id === '\0virtual:aasa.json') {
        const appleTeamId = env.VITE_APPLE_TEAM_ID
        const appleBundleId = env.VITE_APPLE_BUNDLE_ID
        if (appleTeamId && appleBundleId) {
          const aasa = {
            applinks: {
              apps: [],
              details: [
                {
                  appID: `${appleTeamId}.${appleBundleId}`,
                  paths: ['/p/*'],
                },
              ],
            },
          }
          return JSON.stringify(aasa, null, 2)
        }
        return ''
      }
      return null
    },
    generateBundle(options) {
      const androidSha256 = env.VITE_ANDROID_SHA256
      if (androidSha256) {
        const assetlinks = [
          {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: {
              namespace: 'android_app',
              package_name: 'com.petaverse.app',
              sha256_cert_fingerprints: [androidSha256],
            },
          },
        ]
        this.emitFile({
          type: 'asset',
          fileName: '.well-known/assetlinks.json',
          source: JSON.stringify(assetlinks, null, 2),
        })
      }

      const appleTeamId = env.VITE_APPLE_TEAM_ID
      const appleBundleId = env.VITE_APPLE_BUNDLE_ID
      if (appleTeamId && appleBundleId) {
        const aasa = {
          applinks: {
            apps: [],
            details: [
              {
                appID: `${appleTeamId}.${appleBundleId}`,
                paths: ['/p/*'],
              },
            ],
          },
        }
        this.emitFile({
          type: 'asset',
          fileName: '.well-known/apple-app-site-association',
          source: JSON.stringify(aasa, null, 2),
        })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl    = env.VITE_BACKEND_URL ?? 'http://localhost:5075/api'
  const backendOrigin = new URL(backendUrl).origin

  const csp = [
    "default-src 'self'",
    "script-src 'self' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://media.petaverseapp.com https://cdn.example.com https://*.r2.cloudflarestorage.com",
    `connect-src 'self' ${backendOrigin} https://media.petaverseapp.com https://*.r2.cloudflarestorage.com https://cloudflareinsights.com`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')

  return {
    plugins: [react(), tailwindcss(), cspPlugin(csp), wellKnownPlugin(env)],
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
