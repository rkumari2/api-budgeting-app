const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "database.json");

app.use(cors());
app.use(express.json());

const readDB = () => {
  const data = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH, "utf8") : "[]";
  return JSON.parse(data);
};

app.get("/api/transactions", (req, res) => {
  const transactions = readDB();
  res.json(transactions);
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
