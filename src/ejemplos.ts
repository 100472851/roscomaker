// Dos roscos de ejemplo, escritos para este proyecto. Sirven para probar la app y para el duelo.
// Pasan la revisión sin avisos: ninguna pista nombra una respuesta que salga más tarde.

import { roscoNuevo, type Rosco, type Tipo } from './modelo.ts';

type Fila = [letra: string, tipo: Tipo, pista: string, ...respuestas: string[]];

function crear(id: string, nombre: string, filas: Fila[], extra: (r: Rosco) => void): Rosco {
  const r = roscoNuevo(nombre, filas.map(f => f[0]));
  r.id = id;
  r.editado = 0;
  r.preguntas = filas.map(([letra, tipo, pista, ...respuestas]) => ({ letra, tipo, pista, respuestas }));
  extra(r);
  return r;
}

export const EJEMPLO_CINE = crear('ejemplo-cine', 'Rosco de cine', [
  ['A', 'empieza', 'Película de James Cameron de 2009 ambientada en el planeta Pandora', 'Avatar'],
  ['B', 'empieza', 'Apellido del agente secreto con licencia para matar y número 007', 'Bond', 'James Bond'],
  ['C', 'empieza', 'Película de 1942 con Humphrey Bogart e Ingrid Bergman ambientada en Marruecos', 'Casablanca'],
  ['D', 'empieza', 'Película de 2021 basada en la novela de Frank Herbert sobre el planeta Arrakis', 'Dune'],
  ['E', 'empieza', 'Película de 1982 sobre un extraterrestre que solo quiere llamar a su casa', 'E.T.', 'ET', 'E.T. el extraterrestre'],
  ['F', 'empieza', 'Película de los hermanos Coen de 1996 con un secuestro que sale fatal en la nieve de Minnesota', 'Fargo'],
  ['G', 'empieza', 'Película de Ridley Scott del año 2000 con Russell Crowe en el Coliseo romano', 'Gladiator'],
  ['H', 'empieza', 'Apellido del director de «Psicosis» y «Los pájaros»', 'Hitchcock'],
  ['I', 'empieza', 'Película de 2014 sobre un viaje a través de un agujero de gusano, con Matthew McConaughey', 'Interstellar'],
  ['J', 'empieza', 'Parque de dinosaurios de la novela de Michael Crichton llevada al cine en 1993', 'Jurassic Park', 'Parque Jurásico'],
  ['K', 'empieza', 'Gorila gigante que escala el Empire State en la película de 1933', 'King Kong'],
  ['L', 'empieza', 'Princesa de la saga de las galaxias, hermana de Luke', 'Leia'],
  ['M', 'empieza', 'Película de 1999 en la que Neo se toma la pastilla roja', 'Matrix', 'The Matrix'],
  ['N', 'empieza', 'Apellido del director de «Oppenheimer» y «El caballero oscuro»', 'Nolan'],
  ['Ñ', 'contiene', 'Película de Fernando Trueba de 1998, con Penélope Cruz, sobre un rodaje español en la Alemania nazi', 'La niña de tus ojos'],
  ['O', 'empieza', 'Estatuilla dorada que entrega cada año la Academia de Hollywood', 'Óscar', 'Oscar'],
  ['P', 'empieza', 'Película surcoreana de Bong Joon-ho que ganó el premio a la mejor película en 2020', 'Parásitos', 'Parasite'],
  ['Q', 'empieza', 'Película de Pedro Almodóvar de 1984 con Carmen Maura como ama de casa al límite', '¿Qué he hecho yo para merecer esto!!', 'Qué he hecho yo para merecer esto'],
  ['R', 'empieza', 'Boxeador de Filadelfia interpretado por Sylvester Stallone', 'Rocky', 'Rocky Balboa'],
  ['S', 'empieza', 'Apellido del director de «Tiburón», «E.T.» y «Jurassic Park»', 'Spielberg'],
  ['T', 'empieza', 'Apellido del director de «Pulp Fiction» y «Kill Bill»', 'Tarantino'],
  ['U', 'empieza', 'Película de Pixar de 2009 en la que una casa sale volando atada a miles de globos', 'Up'],
  ['V', 'empieza', 'Película de Hitchcock de 1958 con James Stewart y su miedo a las alturas', 'Vértigo', 'Vertigo'],
  ['W', 'empieza', 'Robot de Pixar que se queda solo limpiando la Tierra', 'WALL·E', 'Wall-E', 'Walle'],
  ['X', 'contiene', 'Película de Alex Garland sobre una inteligencia artificial llamada Ava', 'Ex Machina'],
  ['Y', 'empieza', 'Maestro jedi pequeño, verde y con una forma muy suya de ordenar las frases', 'Yoda'],
  ['Z', 'empieza', 'Apellido del director de «Regreso al futuro» y «Forrest Gump»', 'Zemeckis'],
], r => {
  r.portada = { linea: 'BIENVENIDOS AL ROSCO DE', grande: 'CINE', etiqueta: '¡ACCIÓN!', fecha: 'Sesión doble' };
  r.tema = { fondo: '#120f16', acento: '#e8341c', ficha: '#1f2a5e', resalte: '#f5e6a8', ok: '#22c55e', ko: '#e5231a', fuente: 'anton', foto: null };
});

export const EJEMPLO_CIENCIA = crear('ejemplo-ciencia', 'Rosco de ciencia', [
  ['A', 'empieza', 'Unidad de intensidad de corriente eléctrica del Sistema Internacional', 'Amperio', 'Ampere'],
  ['B', 'empieza', 'Unidad mínima de información en informática: vale cero o uno', 'Bit'],
  ['C', 'empieza', 'Apellido de la científica polaca que ganó dos premios Nobel, uno de Física y otro de Química', 'Curie', 'Marie Curie'],
  ['D', 'empieza', 'Componente electrónico que solo deja pasar la corriente en un sentido', 'Diodo'],
  ['E', 'empieza', 'Partícula subatómica con carga negativa', 'Electrón'],
  ['F', 'empieza', 'Unidad de capacidad eléctrica, la de los condensadores', 'Faradio'],
  ['G', 'empieza', 'Científico italiano que defendió que la Tierra gira alrededor del Sol y acabó juzgado por la Inquisición', 'Galileo', 'Galileo Galilei'],
  ['H', 'empieza', 'Unidad de frecuencia: una vez por segundo', 'Hercio', 'Hertz'],
  ['I', 'empieza', 'Red mundial que une millones de redes de ordenadores', 'Internet'],
  ['J', 'empieza', 'Planeta más grande del sistema solar', 'Júpiter'],
  ['K', 'empieza', 'Unidad de temperatura del Sistema Internacional que empieza en el cero absoluto', 'Kelvin'],
  ['L', 'empieza', 'Haz de radiación coherente y muy concentrada que se usa en la fibra óptica y en los lectores de códigos de barras', 'Láser'],
  ['M', 'empieza', 'Apellido del inventor italiano pionero de la radio', 'Marconi'],
  ['N', 'empieza', 'Apellido del científico inglés que formuló la ley de la gravitación universal', 'Newton'],
  ['Ñ', 'contiene', 'Magnitud que varía con el tiempo y lleva información: se modula, se filtra y se muestrea', 'Señal'],
  ['O', 'empieza', 'Unidad de resistencia eléctrica', 'Ohmio', 'Ohm'],
  ['P', 'empieza', 'Número irracional que relaciona la longitud de una circunferencia con su diámetro', 'Pi'],
  ['Q', 'empieza', 'Ciencia que estudia la composición de la materia y cómo se transforma', 'Química'],
  ['R', 'empieza', 'Sistema que detecta objetos lanzando ondas de radio y escuchando el eco', 'Radar'],
  ['S', 'empieza', 'Material como el silicio, base de los chips, que conduce a medias', 'Semiconductor'],
  ['T', 'empieza', 'Apellido del inventor de origen serbio pionero de la corriente alterna', 'Tesla', 'Nikola Tesla'],
  ['U', 'empieza', 'Planeta que gira tumbado, con el eje casi paralelo a su órbita', 'Urano'],
  ['V', 'empieza', 'Unidad de tensión eléctrica', 'Voltio', 'Volt'],
  ['W', 'empieza', 'Red inalámbrica local basada en el estándar IEEE 802.11', 'Wifi', 'Wi-Fi'],
  ['X', 'contiene', 'Gas que respiramos y que las células usan para obtener energía', 'Oxígeno'],
  ['Y', 'empieza', 'Elemento químico de símbolo I que se usa como desinfectante', 'Yodo'],
  ['Z', 'contiene', 'Radiación electromagnética que vemos y que viaja a unos 300.000 kilómetros por segundo', 'Luz'],
], r => {
  r.portada = { linea: 'BIENVENIDOS AL ROSCO DE', grande: 'CIENCIA', etiqueta: '¡EUREKA!', fecha: '' };
  r.tema = { fondo: '#0d1418', acento: '#1f8fff', ficha: '#183c35', resalte: '#c6f6e4', ok: '#22c55e', ko: '#e5231a', fuente: 'space', foto: null };
  r.opciones.sentido = 'za';
});

export const EJEMPLOS = [EJEMPLO_CINE, EJEMPLO_CIENCIA];
