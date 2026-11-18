// Lectura de una foto en el navegador: una copia reducida para el fondo y unos pocos píxeles para sacar colores.

export interface FotoLeida { fondo: string; pixeles: Uint8ClampedArray }

function cargarImagen(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!archivo.type.startsWith('image/')) { reject(new Error('Ese archivo no es una imagen.')); return; }
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se ha podido abrir la imagen.')); };
    img.src = url;
  });
}

function dibujar(img: HTMLImageElement, lado: number): HTMLCanvasElement {
  const k = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

/** La foto se guarda pequeña (900 px, JPEG) porque va desenfocada y el navegador tiene poco sitio. */
export async function leerFoto(archivo: File): Promise<FotoLeida> {
  const img = await cargarImagen(archivo);
  const fondo = dibujar(img, 900).toDataURL('image/jpeg', 0.62);
  const peq = dibujar(img, 96);
  const pixeles = peq.getContext('2d')!.getImageData(0, 0, peq.width, peq.height).data;
  return { fondo, pixeles };
}
