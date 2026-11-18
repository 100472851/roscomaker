# RoscoMaker

- Arrancar: `npm install` y `npm run dev` (http://localhost:5173).
- Probar: `npm test` (lógica), `npm run build && npm run e2e` (navegador), `npm run check` (tipos).
- Métricas del README: `npm run medir` → escribe `results/medidas.md`. Nunca escribir cifras a mano.
- Demo: `python3 scripts/demo.py` (tras `npm run build`) → `results/demo.gif`.
- La lógica va en `src/*.ts` sin tocar el DOM (partida, corrector, revisión, paleta, importar, duelo, compartir).
  Las pantallas van en `src/vistas/`. Cada función nueva de lógica lleva su prueba en `tests/unit/`.
- El build es un único `index.html` (vite-plugin-singlefile): no añadir recursos que no puedan ir dentro.
- Sin servidor y sin claves: todo se guarda en el navegador (localStorage).
- Nada de datos de personas reales en los ejemplos ni en las pruebas.
- Textos de la interfaz en español de España.
- Antes de empezar una sesión, leer `notes/estado.md`.
