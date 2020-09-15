const express = require("express");
const { Pool } = require("pg");

const port = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  host: "db",
  port: 5432,
});

app.get("/", (req, res) => {
  pool.query("SELECT * FROM haikus ORDER BY id", (_, haikus) => {
    res.render("index", { haikus: haikus.rows });
  });
});

app.post("/heart", (req, res) => {
  pool.query(
    "UPDATE haikus SET hearts = hearts + 1 WHERE id = $1",
    [req.body.idz],
    () => res.send("Success")
  );
});

app.listen(port, () =>
  console.log("Server running on: ", "http://localhost:3000")
);
