import { defineConfig } from 'tsup'

export default defineConfig({
  format: ['cjs', 'esm'],
  entryPoints: ['src/index.ts'],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  outDir: 'dist',
  external: [], // No external dependencies!
  minify: true, // Enable minification for smaller bundle
  treeshake: true, // Enable tree-shaking
  splitting: false, // Keep as single bundle for simplicity
  sourcemap: false, // Disable sourcemaps for smaller size
})
