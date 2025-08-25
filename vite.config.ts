import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/courses': {
        target: `${process.env.VITE_SUPABASE_URL}/functions/v1/get-courses`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/courses/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
          'apikey': process.env.VITE_SUPABASE_ANON_KEY || ''
        }
      },
      '/api/courses/generate': {
        target: `${process.env.VITE_SUPABASE_URL}/functions/v1/ai-generate-course`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/courses\/generate/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
          'apikey': process.env.VITE_SUPABASE_ANON_KEY || ''
        }
      },
      '/api/courses/images': {
        target: `${process.env.VITE_SUPABASE_URL}/functions/v1/generate-course-images`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/courses\/images/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ''}`,
          'apikey': process.env.VITE_SUPABASE_ANON_KEY || ''
        }
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries - bibliotecas principais
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],
          'vendor-utils': [
            '@tanstack/react-query',
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'zustand',
            'sonner'
          ],
          'vendor-forms': [
            'react-hook-form'
          ],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-editor': ['react-quill'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          'vendor-date': ['date-fns'],
          'vendor-misc': [
            'lucide-react',
            'cmdk',
            'embla-carousel-react',
            'html2canvas',
            'input-otp',
            'react-day-picker',
            'react-helmet-async',
            'react-resizable-panels',
            'vaul'
          ]
        },
        // Configuração para chunks menores
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Aumentar limite de aviso para chunks grandes
    chunkSizeWarningLimit: 1000,
    // Otimizações adicionais
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
  },
}));
