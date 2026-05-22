const bcrypt = require('bcryptjs');
const password = "Rectorado2026";
const hash = bcrypt.hashSync(password, 10);
console.log("Copia este hash en tu archivo .env:");
console.log(hash);