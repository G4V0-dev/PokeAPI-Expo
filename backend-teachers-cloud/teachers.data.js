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
    name_lower: 'leonardo valenzuela rodriguez',
    aliases: ['leonardo', 'valenzuela', 'rodriguez'],
    seed_key: 'leonardo-valenzuela-rodriguez',
    data: {
      id: 2,
      name: 'Leonardo Valenzuela Rodriguez',
      profession: 'Backend Engineer (.NET y Azure) | Sistemas FinTech | APIs y Microservicios | IA aplicada al negocio | Docente universitario',
      headline:
        'Backend Engineer con experiencia en .NET, Azure, SQL Server, APIs REST y microservicios, enfocado en sistemas FinTech.',
      description:
        'Backend Engineer con experiencia en desarrollo backend en .NET, Azure, SQL Server, APIs REST y microservicios, enfocado en sistemas FinTech y plataformas transaccionales. Actualmente trabaja como Software Development Engineer – Backend en KinPOS, participando en el desarrollo, mantenimiento e integración de servicios backend en .NET, aplicando principios de Clean Architecture, automatización y buenas prácticas de ingeniería de software. Cuento con un Máster en Inteligencia Artificial, con experiencia en Python, machine learning, análisis de datos y automatización de procesos, aplicando soluciones de IA orientadas a negocio. Adicionalmente, me desempeño como docente universitario en ingeniería, fortaleciendo habilidades de comunicación técnica, liderazgo y pensamiento estructurado.',
      photo: avatar('Leonardo Valenzuela Rodriguez'),
      profileUrl: 'https://www.linkedin.com/in/leonardo-valenzuela-rodriguez/',
      area: 'Ingenieria de Software · Backend · FinTech',
    },
  },
  {
    id: 3,
    order: 3,
    name_lower: 'fredy angel davila',
    aliases: ['fredy', 'davila', 'angel'],
    seed_key: 'fredy-angel-davila',
    data: {
      id: 3,
      name: 'Fredy Angel Davila',
      profession: 'Decano de Ingeniería | Autoevaluación | Planeación estratégica | Registros calificados | Directivo IES',
      headline:
        'Decano de Ingeniería con amplia experiencia en autoevaluación, planeación estratégica y gestión académica.',
      description:
        'Decano de Ingeniería, especialista en gerencia de proyectos, especialista en educación y egresado de ingeniería electrónica, con amplia experiencia en administración educativa. Ha desempeñado roles de decano y director de programas académicos como electrónica, Ingeniería mecatrónica, Informática e Ingeniería de sistemas; además, ha dirigido procesos de planeación estratégica, investigación, autoevaluación y relación con el sector externo. Su experiencia se relaciona con la planeación estratégica, gestión y ejecución de proyectos, procesos de calidad, diseño de programas académicos, renovación de registros calificados bajo la resolución 21795, autoevaluación y acreditación. En su desempeño profesional ha liderado la planeación y ejecución de dos proyectos de gran cuantía y ha participado como especialista en educación y como ingeniero de diseño.',
      photo: avatar('Fredy Angel Davila'),
      profileUrl: 'https://www.linkedin.com/in/fredy-angel-davila/',
      area: 'Administracion educativa · Ingenieria',
    },
  },
];

module.exports = { TEACHERS };
