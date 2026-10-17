// Puente para Render: si la plataforma arranca con `node index.js` (start
// command por defecto cuando no detectó package.json), delegar en server.js.
// Con `npm start` este archivo no se usa.
require('./server.js');
