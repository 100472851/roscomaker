# Estado

**Dónde estamos:** primera versión completa. Biblioteca, editor (letras, preguntas, pegar desde hoja de cálculo, revisión con destripes), tema desde foto, juego en modo escribir y modo presentador, vista de presentador en otra ventana, duelo con tiempo, exportar HTML sin internet / JSON / enlace / hoja de soluciones. Pruebas de lógica y de navegador pasando. README con medidas y demo.

**Siguiente paso:** publicar el repo con GitHub Desktop y activar GitHub Pages (Settings → Pages → Source: GitHub Actions). El README ya enlaza a 100472851.github.io/roscomaker.

**Dudas abiertas:**
- ¿Nombre definitivo? RoscoMaker por ahora (no usar «Pasapalabra»: es una marca).
- Mando desde el móvil: necesitaría servidor o WebRTC; fuera de la versión 1.
- ¿Probar en Safari? Solo está probado en Chromium.
- `npm audit` marca 6 avisos altos en dependencias de desarrollo (picomatch, ReDoS). No llegan al HTML que se publica; el arreglo automático fuerza saltos de versión mayor. Revisar cuando Vite/Vitest actualicen.
