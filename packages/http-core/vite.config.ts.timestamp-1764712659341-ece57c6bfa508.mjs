// vite.config.ts
import { defineConfig } from "file:///Users/festusyeboah/Documents/2025/architecture-book/web-loom/packages/http-core/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/festusyeboah/Documents/2025/architecture-book/web-loom/node_modules/vite-plugin-dts/dist/index.mjs";
var vite_config_default = defineConfig({
  build: {
    outDir: "dist",
    // Explicitly set outDir
    lib: {
      entry: "./src/index.ts",
      formats: ["es", "umd"],
      name: "HttpCore",
      // For UMD global variable
      fileName: (format) => `http-core.${format}.js`
    },
    rollupOptions: {
      // No external dependencies - zero runtime dependencies!
    }
  },
  plugins: [dts({ insertTypesEntry: true, outDir: "dist", tsconfigPath: "./tsconfig.json", rollupTypes: true })],
  // also specify for dts plugin
  server: {
    // Expose tests directory for the custom runner
    fs: {
      allow: [".", "tests"]
      // Allow serving files from root and tests directory
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZmVzdHVzeWVib2FoL0RvY3VtZW50cy8yMDI1L2FyY2hpdGVjdHVyZS1ib29rL3dlYi1sb29tL3BhY2thZ2VzL2h0dHAtY29yZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2Zlc3R1c3llYm9haC9Eb2N1bWVudHMvMjAyNS9hcmNoaXRlY3R1cmUtYm9vay93ZWItbG9vbS9wYWNrYWdlcy9odHRwLWNvcmUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2Zlc3R1c3llYm9haC9Eb2N1bWVudHMvMjAyNS9hcmNoaXRlY3R1cmUtYm9vay93ZWItbG9vbS9wYWNrYWdlcy9odHRwLWNvcmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JywgLy8gRXhwbGljaXRseSBzZXQgb3V0RGlyXG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogJy4vc3JjL2luZGV4LnRzJyxcbiAgICAgIGZvcm1hdHM6IFsnZXMnLCAndW1kJ10sXG4gICAgICBuYW1lOiAnSHR0cENvcmUnLCAvLyBGb3IgVU1EIGdsb2JhbCB2YXJpYWJsZVxuICAgICAgZmlsZU5hbWU6IChmb3JtYXQpID0+IGBodHRwLWNvcmUuJHtmb3JtYXR9LmpzYCxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIC8vIE5vIGV4dGVybmFsIGRlcGVuZGVuY2llcyAtIHplcm8gcnVudGltZSBkZXBlbmRlbmNpZXMhXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW2R0cyh7IGluc2VydFR5cGVzRW50cnk6IHRydWUsIG91dERpcjogJ2Rpc3QnLCB0c2NvbmZpZ1BhdGg6ICcuL3RzY29uZmlnLmpzb24nLCByb2xsdXBUeXBlczogdHJ1ZSB9KV0sIC8vIGFsc28gc3BlY2lmeSBmb3IgZHRzIHBsdWdpblxuICBzZXJ2ZXI6IHtcbiAgICAvLyBFeHBvc2UgdGVzdHMgZGlyZWN0b3J5IGZvciB0aGUgY3VzdG9tIHJ1bm5lclxuICAgIGZzOiB7XG4gICAgICBhbGxvdzogWycuJywgJ3Rlc3RzJ10sIC8vIEFsbG93IHNlcnZpbmcgZmlsZXMgZnJvbSByb290IGFuZCB0ZXN0cyBkaXJlY3RvcnlcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWthLFNBQVMsb0JBQW9CO0FBQy9iLE9BQU8sU0FBUztBQUVoQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUE7QUFBQSxJQUNSLEtBQUs7QUFBQSxNQUNILE9BQU87QUFBQSxNQUNQLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxNQUNyQixNQUFNO0FBQUE7QUFBQSxNQUNOLFVBQVUsQ0FBQyxXQUFXLGFBQWEsTUFBTTtBQUFBLElBQzNDO0FBQUEsSUFDQSxlQUFlO0FBQUE7QUFBQSxJQUVmO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsTUFBTSxRQUFRLFFBQVEsY0FBYyxtQkFBbUIsYUFBYSxLQUFLLENBQUMsQ0FBQztBQUFBO0FBQUEsRUFDN0csUUFBUTtBQUFBO0FBQUEsSUFFTixJQUFJO0FBQUEsTUFDRixPQUFPLENBQUMsS0FBSyxPQUFPO0FBQUE7QUFBQSxJQUN0QjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
