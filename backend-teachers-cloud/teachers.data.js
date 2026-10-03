/**
 * Datos semilla (3 docentes UNINPAHU).
 * Fuente publica: busqueda web + snippets de LinkedIn/uninpahu.edu.co/p4s.co
 * (LinkedIn responde 999 al scraping directo, por eso los textos son
 * res posibilitadas + headline/description y NO scraping literal del HTML).
 *
 * FOTOS: Elfar y Javier se resuelven en vivo vía unavatar.io (proxy público
 * de avatares LinkedIn por vanity name, sin scraping). La de Lotus viene de
 * la web oficial UNINPAHU (su LinkedIn no expone foto pública). Para fijar
 * una foto definitiva, reemplazar `photo` por la URL directa (S3/Cloudinary)
 * y re-ejecutar `npm run seed`.
 */

function avatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D64545&color=fff&size=512`;
}

// Proxy en vivo a la foto pública de LinkedIn (vanity name exacto del perfil).
function linkedinPhoto(vanity) {
  return `https://unavatar.io/linkedin/${vanity}`;
}

const TEACHERS = [
  {
    id: 1,
    order: 1,
    name_lower: 'elfar didier morantes sanchez',
    aliases: ['elfar', 'morantes', 'didier'],
    seed_key: 'elfar-didier-morantes-sanchez',
    data: {
      id: 1,
      name: 'Elfar Didier Morantes Sanchez',
      profession: 'Ingeniero Electronico · Especialista en Ingenieria de Software · Docente FullStack',
      headline:
        'Ingeniero Electronico, Especialista en Ingenieria de Software, candidato a Magister en Educacion y E-learning.',
      description:
        'Curioso y con ganas de aprender cosas nuevas. Desarrollador FullStack con enfasis en backend en C, C++, C#, Python, Java, JavaScript, PHP, HTML5+CSS3-Bootstrap; bases de datos MariaDB, PostgreSQL, Oracle, SQLServer y desarrollo movil Android. Instructor y docente universitario (bootcamps frontend, participante Bootcamp IA UNINPAHU). Fuente publica: p4s.co + posts LinkedIn.',
      photo: linkedinPhoto('elfar-didier-morantes-s%C3%A1nchez'),
      profileUrl: 'https://www.linkedin.com/in/elfar-didier-morantes-s%C3%A1nchez/',
      area: 'Ingenieria y Tecnologias de la Informacion',
    },
  },
  {
    id: 2,
    order: 2,
    name_lower: 'lotus king salcedo vallejo',
    aliases: ['lotus', 'salcedo', 'king'],
    seed_key: 'lotus-king-salcedo-vallejo',
    data: {
      id: 2,
      name: 'Lotus King Salcedo Vallejo',
      profession: 'Psicologo · Director de Investigacion y Proyeccion Social UNINPAHU',
      headline:
        'Psicologo, maestrando en Filosofia (UNAL) y coordinador de investigacion en educacion superior.',
      description:
        'Dirige Investigacion, Proyeccion Social, Internacionalizacion, Idiomas, Practicas y Biblioteca en UNINPAHU; gestiona grupos, proyectos, semilleros y espacios academicos; acompana calidad, visitas de pares ante MEN y MinCiencias; formula politicas, lineamientos y documentos maestros. Docente lider de investigacion Facultad de Ingenieria UNINPAHU y lider del semillero de Epistemologia, Logica y Etica. Intereses: etica, bioetica, psicologia moral, filosofia politica, filosofia de la mente y educacion superior. Fuente: LinkedIn + uninpahu.edu.co.',
      photo: 'https://uninpahu.edu.co/wp-content/uploads/elementor/thumbs/Lotus-King-2-scaled-e1724260154302-rd7sbvc649grlvtvbegnn91si85yjd2v65ycugjkw8.jpg', // foto oficial web UNINPAHU (LinkedIn sin foto publica)
      profileUrl: 'https://www.linkedin.com/in/lotus-king-salcedo-vallejo/',
      area: 'Investigacion UNINPAHU',
    },
  },
  {
    id: 3,
    order: 3,
    name_lower: 'javier duvan amado acosta',
    aliases: ['javier', 'amado', 'duvan'],
    seed_key: 'javier-duvan-amado-acosta-82b21851',
    data: {
      id: 3,
      name: 'Javier Duvan Amado Acosta',
      profession: 'Directivo senior en educacion superior · Exrector · Exgerente FODESEP',
      headline:
        'Directivo senior en educacion superior | Exrector, exgerente general FODESEP y exdirector ejecutivo ACIET.',
      description:
        'Trayectoria como rector, vicerrector academico, gerente general, director ejecutivo y consultor estrategico de IES. Lidero gobierno institucional, sostenibilidad financiera, aseguramiento de la calidad, transformacion digital, educacion virtual y diversificacion de ingresos; registros calificados, acreditacion y fortalecimiento organizacional. Exgerente general FODESEP (2022-2024), exdirector ejecutivo ACIET (2019-2021), rector UVIRTUAL y vicerrector CUN. Fuente: LinkedIn.',
      photo: linkedinPhoto('javier-duvan-amado-acosta-82b21851'),
      profileUrl: 'https://www.linkedin.com/in/javier-duvan-amado-acosta-82b21851/',
      area: 'Direccion universitaria',
    },
  },
];

module.exports = { TEACHERS };
