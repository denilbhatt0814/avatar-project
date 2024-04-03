const express = require("express");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(fileUpload());
app.use(morgan("tiny"));

// route imports
const avatarRouter = require("./routes/avatar.route");
app.use("/api/v1/avatar", avatarRouter);

// Health check route
app.get("/api/v1/health", async (req, res) => {
  return res.send("Running...");
});

module.exports = app;
