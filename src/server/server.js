const express = require("express");
const app = express();
const { PORT } = require("../../config.json");


const port = PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const start = () => {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
};


module.exports = { start };