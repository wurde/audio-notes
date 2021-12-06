const bcrypt = require("bcrypt");

const SALT = 14;

function createPasswordHash() {
  if (process.argv.length != 3) {
    throw Error("Missing password argument");
  }
  const password = process.argv[2];

  const salt = bcrypt.genSaltSync(SALT);
  const hash = bcrypt.hashSync(password, salt);

  console.log(`HASH ${hash}`);
  return hash;
}

createPasswordHash();
