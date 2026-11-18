# Medidas

Generado con `npm run medir` sobre las 54 respuestas de los roscos de ejemplo. Semilla fija: siempre salen las mismas cifras.

| Qué se mide | Resultado |
| --- | --- |
| Respuestas bien escritas aceptadas (tal cual, minúsculas, mayúsculas y sin tildes) | 100 % |
| Respuestas de 5 letras o más con una errata aceptadas sin preguntar (860 intentos) | 100 % |
| Lo mismo con Levenshtein clásico (intercambiar dos letras cuenta como dos erratas) | 86 % |
| Respuestas de 4 letras o menos con una errata aceptadas sin preguntar | 3.6 % (a propósito: en palabras cortas una errata cambia la palabra) |
| Respuestas de otra letra del mismo rosco aceptadas por error (1404 pares) | 0 % |
| Fotos sintéticas aleatorias cuyo reparto de colores cumple los contrastes mínimos (500 fotos) | 100 % |
| Largo del código del enlace para compartir el rosco de cine (27 letras, sin foto) | 2264 caracteres |
| Tamaño de la app compilada (un solo HTML con tipografías) | 309 KB |

Lo que el corrector no acepta no se da por malo: la partida pregunta «¿Es válida?» a quien presenta.
