const { Pool } = require("pg");

exports.createDb = () => {
  return new Pool();
};
