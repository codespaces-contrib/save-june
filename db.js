const { Pool } = require("pg");

exports.createDb = () => {
  return new Pool({
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    host: "db",
    port: 5432,
  });
};
