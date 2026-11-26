import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  target: 'node18',
  dts: true,
  clean: true,
  shims: true,
  define: { PLUGIN_MARKETPLACE_VERSION: JSON.stringify(process.env.npm_package_version ?? '1.6.6') },
})
