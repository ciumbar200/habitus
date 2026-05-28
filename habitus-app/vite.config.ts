import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const appDir = path.resolve(import.meta.dirname);

/** Monorepo: .env.local en habitus-app/ gana sobre el de la raíz del workspace. */
function loadAppEnv(mode: string) {
  const workspaceRoot = path.resolve(appDir, "..");
  return {
    ...loadEnv(mode, workspaceRoot, "VITE_"),
    ...loadEnv(mode, appDir, "VITE_"),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadAppEnv(mode);

  return {
  envDir: appDir,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'brand/moon-logo-black.png',
        'brand/moon-logo-original.webp',
        'favicon.svg',
      ],
      manifest: {
        name: ': moon shared living',
        short_name: ': moon',
        description: 'Vivienda compartida con compatibilidad real — varias ciudades en España',
        theme_color: '#0c0a09',
        background_color: '#fafaf9',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/brand/moon-logo-black.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/brand/moon-logo-black.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Explorar alojamientos',
            short_name: 'Explorar',
            description: 'Ver habitaciones y pisos disponibles',
            url: '/alojamientos',
            icons: [{ src: '/brand/moon-logo-black.png', sizes: '96x96' }]
          },
          {
            name: 'Mi perfil',
            short_name: 'Perfil',
            description: 'Ver y editar tu perfil',
            url: '/profile',
            icons: [{ src: '/brand/moon-logo-black.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,webp,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // heroes ~2.2 MB; bundle JS ~5.6 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/qectypyfbjlhabdmxigk\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'images',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 64,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [200],
                headers: {
                  'Content-Type': 'image/',
                },
              },
            },
          },
        ]
      },
      devOptions: {
        // Evita SW en dev que cachee bundles sin variables de entorno.
        enabled: false,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@habitus/core": path.resolve(__dirname, "../packages/habitus-core/src/index.ts"),
    },
  },
  optimizeDeps: {
    // Paquete local vía alias: no pre-bundlear (evita exports obsoletos en .vite/deps).
    exclude: ["@habitus/core"],
  },
  build: {
    chunkSizeWarningLimit: 10000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  },
  server: {
    fs: { allow: [".."] },
  },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL ?? ""),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
      env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    ),
  },
};
});
