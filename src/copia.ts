// Copia exacta de la página tal y como llegó, antes de que la app toque nada. Se importa la primera.
// Con ella se exporta un rosco como un HTML que funciona solo y sin internet (la app entera va en un archivo).
export const COPIA_PAGINA = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
