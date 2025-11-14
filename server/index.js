const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Serve React build
const buildPath = path.join(__dirname, "../dist"); // adjust if your build folder differs
app.use(express.static(buildPath));

// POST endpoint to save responses
app.post("/api/saveResponses", (req, res) => {
  const { author, task, data } = req.body;

  if (!author || !task || !data) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const filename = `${author}_responses_task_${task}.json`;
  const savePath = path.join(__dirname, "responses", filename);

  fs.mkdirSync(path.dirname(savePath), { recursive: true });

  fs.writeFile(savePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("Failed to save response:", err);
      return res.status(500).json({ error: "Failed to save file" });
    }
    res.json({ message: `Saved as ${filename}` });
  });
});

// Serve React for any other route
app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
