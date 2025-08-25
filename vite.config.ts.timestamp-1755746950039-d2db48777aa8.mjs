// vite.config.ts
import { defineConfig } from "file:///C:/Users/cleyt/Documents/git1/ai-squads-academy/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/cleyt/Documents/git1/ai-squads-academy/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/cleyt/Documents/git1/ai-squads-academy/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\cleyt\\Documents\\git1\\ai-squads-academy";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/courses/generate": {
        target: `${process.env.VITE_SUPABASE_URL}/functions/v1/ai-generate-course`,
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api\/courses\/generate/, ""),
        headers: {
          "Authorization": `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ""}`,
          "apikey": process.env.VITE_SUPABASE_ANON_KEY || ""
        }
      },
      "/api/courses/images": {
        target: `${process.env.VITE_SUPABASE_URL}/functions/v1/generate-course-images`,
        changeOrigin: true,
        rewrite: (path2) => path2.replace(/^\/api\/courses\/images/, ""),
        headers: {
          "Authorization": `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || ""}`,
          "apikey": process.env.VITE_SUPABASE_ANON_KEY || ""
        }
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries - bibliotecas principais
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip"
          ],
          "vendor-utils": [
            "@tanstack/react-query",
            "clsx",
            "class-variance-authority",
            "tailwind-merge",
            "zustand",
            "sonner"
          ],
          "vendor-forms": [
            "react-hook-form"
          ],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-editor": ["react-quill"],
          "vendor-charts": ["recharts"],
          "vendor-motion": ["framer-motion"],
          "vendor-date": ["date-fns"],
          "vendor-misc": [
            "lucide-react",
            "cmdk",
            "embla-carousel-react",
            "html2canvas",
            "input-otp",
            "react-day-picker",
            "react-helmet-async",
            "react-resizable-panels",
            "vaul"
          ]
        },
        // Configuração para chunks menores
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").pop().replace(/\.[^/.]+$/, "") : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        }
      }
    },
    // Aumentar limite de aviso para chunks grandes
    chunkSizeWarningLimit: 1e3,
    // Otimizações adicionais
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: mode === "production"
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxjbGV5dFxcXFxEb2N1bWVudHNcXFxcZ2l0MVxcXFxhaS1zcXVhZHMtYWNhZGVteVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcY2xleXRcXFxcRG9jdW1lbnRzXFxcXGdpdDFcXFxcYWktc3F1YWRzLWFjYWRlbXlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2NsZXl0L0RvY3VtZW50cy9naXQxL2FpLXNxdWFkcy1hY2FkZW15L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpL2NvdXJzZXMvZ2VuZXJhdGUnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBgJHtwcm9jZXNzLmVudi5WSVRFX1NVUEFCQVNFX1VSTH0vZnVuY3Rpb25zL3YxL2FpLWdlbmVyYXRlLWNvdXJzZWAsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC9jb3Vyc2VzXFwvZ2VuZXJhdGUvLCAnJyksXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7cHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCAnJ31gLFxyXG4gICAgICAgICAgJ2FwaWtleSc6IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgJydcclxuICAgICAgICB9XHJcbiAgICAgIH0sXHJcbiAgICAgICcvYXBpL2NvdXJzZXMvaW1hZ2VzJzoge1xyXG4gICAgICAgIHRhcmdldDogYCR7cHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9VUkx9L2Z1bmN0aW9ucy92MS9nZW5lcmF0ZS1jb3Vyc2UtaW1hZ2VzYCxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaVxcL2NvdXJzZXNcXC9pbWFnZXMvLCAnJyksXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7cHJvY2Vzcy5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSB8fCAnJ31gLFxyXG4gICAgICAgICAgJ2FwaWtleSc6IHByb2Nlc3MuZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkgfHwgJydcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXHJcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcclxuICBdLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIC8vIFZlbmRvciBsaWJyYXJpZXMgLSBiaWJsaW90ZWNhcyBwcmluY2lwYWlzXHJcbiAgICAgICAgICAndmVuZG9yLXJlYWN0JzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxyXG4gICAgICAgICAgJ3ZlbmRvci11aSc6IFtcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1hY2NvcmRpb24nLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWFsZXJ0LWRpYWxvZycsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYXZhdGFyJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1jaGVja2JveCcsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1sYWJlbCcsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtcG9wb3ZlcicsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtcHJvZ3Jlc3MnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCcsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3Qtc2VwYXJhdG9yJyxcclxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zbGlkZXInLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXN3aXRjaCcsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdGFicycsXHJcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtdG9hc3QnLFxyXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvb2x0aXAnXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgJ3ZlbmRvci11dGlscyc6IFtcclxuICAgICAgICAgICAgJ0B0YW5zdGFjay9yZWFjdC1xdWVyeScsXHJcbiAgICAgICAgICAgICdjbHN4JyxcclxuICAgICAgICAgICAgJ2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eScsXHJcbiAgICAgICAgICAgICd0YWlsd2luZC1tZXJnZScsXHJcbiAgICAgICAgICAgICd6dXN0YW5kJyxcclxuICAgICAgICAgICAgJ3Nvbm5lcidcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICAndmVuZG9yLWZvcm1zJzogW1xyXG4gICAgICAgICAgICAncmVhY3QtaG9vay1mb3JtJ1xyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgICd2ZW5kb3Itc3VwYWJhc2UnOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxyXG4gICAgICAgICAgJ3ZlbmRvci1lZGl0b3InOiBbJ3JlYWN0LXF1aWxsJ10sXHJcbiAgICAgICAgICAndmVuZG9yLWNoYXJ0cyc6IFsncmVjaGFydHMnXSxcclxuICAgICAgICAgICd2ZW5kb3ItbW90aW9uJzogWydmcmFtZXItbW90aW9uJ10sXHJcbiAgICAgICAgICAndmVuZG9yLWRhdGUnOiBbJ2RhdGUtZm5zJ10sXHJcbiAgICAgICAgICAndmVuZG9yLW1pc2MnOiBbXHJcbiAgICAgICAgICAgICdsdWNpZGUtcmVhY3QnLFxyXG4gICAgICAgICAgICAnY21kaycsXHJcbiAgICAgICAgICAgICdlbWJsYS1jYXJvdXNlbC1yZWFjdCcsXHJcbiAgICAgICAgICAgICdodG1sMmNhbnZhcycsXHJcbiAgICAgICAgICAgICdpbnB1dC1vdHAnLFxyXG4gICAgICAgICAgICAncmVhY3QtZGF5LXBpY2tlcicsXHJcbiAgICAgICAgICAgICdyZWFjdC1oZWxtZXQtYXN5bmMnLFxyXG4gICAgICAgICAgICAncmVhY3QtcmVzaXphYmxlLXBhbmVscycsXHJcbiAgICAgICAgICAgICd2YXVsJ1xyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgLy8gQ29uZmlndXJhXHUwMEU3XHUwMEUzbyBwYXJhIGNodW5rcyBtZW5vcmVzXHJcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6IChjaHVua0luZm8pID0+IHtcclxuICAgICAgICAgIGNvbnN0IGZhY2FkZU1vZHVsZUlkID0gY2h1bmtJbmZvLmZhY2FkZU1vZHVsZUlkXHJcbiAgICAgICAgICAgID8gY2h1bmtJbmZvLmZhY2FkZU1vZHVsZUlkLnNwbGl0KCcvJykucG9wKCkucmVwbGFjZSgvXFwuW14vLl0rJC8sICcnKVxyXG4gICAgICAgICAgICA6ICdjaHVuayc7XHJcbiAgICAgICAgICByZXR1cm4gYGpzLyR7ZmFjYWRlTW9kdWxlSWR9LVtoYXNoXS5qc2A7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICAvLyBBdW1lbnRhciBsaW1pdGUgZGUgYXZpc28gcGFyYSBjaHVua3MgZ3JhbmRlc1xyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxyXG4gICAgLy8gT3RpbWl6YVx1MDBFN1x1MDBGNWVzIGFkaWNpb25haXNcclxuICAgIG1pbmlmeTogJ3RlcnNlcicsXHJcbiAgICB0ZXJzZXJPcHRpb25zOiB7XHJcbiAgICAgIGNvbXByZXNzOiB7XHJcbiAgICAgICAgZHJvcF9jb25zb2xlOiBtb2RlID09PSAncHJvZHVjdGlvbicsXHJcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlUsU0FBUyxvQkFBb0I7QUFDeFcsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLHlCQUF5QjtBQUFBLFFBQ3ZCLFFBQVEsR0FBRyxRQUFRLElBQUksaUJBQWlCO0FBQUEsUUFDeEMsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsNkJBQTZCLEVBQUU7QUFBQSxRQUMvRCxTQUFTO0FBQUEsVUFDUCxpQkFBaUIsVUFBVSxRQUFRLElBQUksMEJBQTBCLEVBQUU7QUFBQSxVQUNuRSxVQUFVLFFBQVEsSUFBSSwwQkFBMEI7QUFBQSxRQUNsRDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLHVCQUF1QjtBQUFBLFFBQ3JCLFFBQVEsR0FBRyxRQUFRLElBQUksaUJBQWlCO0FBQUEsUUFDeEMsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsMkJBQTJCLEVBQUU7QUFBQSxRQUM3RCxTQUFTO0FBQUEsVUFDUCxpQkFBaUIsVUFBVSxRQUFRLElBQUksMEJBQTBCLEVBQUU7QUFBQSxVQUNuRSxVQUFVLFFBQVEsSUFBSSwwQkFBMEI7QUFBQSxRQUNsRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFDVCxnQkFBZ0I7QUFBQSxFQUNsQixFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLFVBQ3pELGFBQWE7QUFBQSxZQUNYO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsZ0JBQWdCO0FBQUEsWUFDZDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsZ0JBQWdCO0FBQUEsWUFDZDtBQUFBLFVBQ0Y7QUFBQSxVQUNBLG1CQUFtQixDQUFDLHVCQUF1QjtBQUFBLFVBQzNDLGlCQUFpQixDQUFDLGFBQWE7QUFBQSxVQUMvQixpQkFBaUIsQ0FBQyxVQUFVO0FBQUEsVUFDNUIsaUJBQWlCLENBQUMsZUFBZTtBQUFBLFVBQ2pDLGVBQWUsQ0FBQyxVQUFVO0FBQUEsVUFDMUIsZUFBZTtBQUFBLFlBQ2I7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUE7QUFBQSxRQUVBLGdCQUFnQixDQUFDLGNBQWM7QUFDN0IsZ0JBQU0saUJBQWlCLFVBQVUsaUJBQzdCLFVBQVUsZUFBZSxNQUFNLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxhQUFhLEVBQUUsSUFDakU7QUFDSixpQkFBTyxNQUFNLGNBQWM7QUFBQSxRQUM3QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLHVCQUF1QjtBQUFBO0FBQUEsSUFFdkIsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYyxTQUFTO0FBQUEsUUFDdkIsZUFBZSxTQUFTO0FBQUEsTUFDMUI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
