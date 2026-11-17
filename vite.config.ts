import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Todo (JS, CSS y tipografías) va dentro de un único index.html:
// así la app funciona sin internet y puede copiarse a sí misma al exportar un rosco.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false, target: 'es2022' },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
