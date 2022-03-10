const { createDb } = require("./db");
const { createServer } = require("./server");

(async function init() {
const [app, server] = createServer();
const db = await createDb();

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  db.query("SELECT * FROM haikus ORDER BY id", (_, haikus) => {
    res.render("index", { haikus: haikus.rows });
  });
});

app.post("/heart", (req, res) => {
  db.query(
    "UPDATE haikus SET hearts = hearts + 1 WHERE id = $1",
    [req.body.idz],
    () => res.send("Success")
  );
});

server.listen(port, () =>
  console.log(`🚀  Server is now running on: http://localhost:${port}`)
);
})()
