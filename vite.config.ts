import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import glsl from 'vite-plugin-glsl'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    glsl({
      include: [
        // Glob pattern, or array of glob patterns to import
        '**/*.glsl',
      ],
    }),
    splitVendorChunkPlugin(),
  ],
  esbuild: {
    treeShaking: true,
  },
  resolve: {
    alias: [
      {
        find: '~',
        replacement: resolve(__dirname, 'src'),
      },
    ],
  },
})
