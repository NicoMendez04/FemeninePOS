const bcrypt = require('bcryptjs');
const password = 'nico123';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) throw err;
  console.log('Hash:', hash);
});
