const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const File = require("./models/file");

// Rest Object
const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));

const upload = multer({ dest: "uploads" });

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1/FileSharing-Site")
  .then(() => console.log("MongoDB Connected"));

// View Engine
app.set("view engine", "ejs");

// Routes
app.get("/", (req, res) => {
  res.render("home");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  };

  // Password setup and password is optional
  if (req.body.password != null && req.body.password !== "") {
    const salt = await bcrypt.genSalt();
    fileData.password = await bcrypt.hash(req.body.password, salt);
  }

  // Create a file
  // { fileLink: `${req.headers.origin}/file/${file.id}` } -- it create brand new url link that will point to the _id of the
  // uploaded file. Now we can use this file link property inside our home.ejs file
  const file = await File.create(fileData);
  // console.log(file);
  // res.send(file.originalName);
  res.render("home", { fileLink: `${req.headers.origin}/file/${file.id}` });
});

// File download server logic
app
  .route("/file/:id")
  .get(handleDownload)
  .post(handleDownload);

async function handleDownload(req, res) {
  const file = await File.findById(req.params.id);

  // If file has password
  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password");
      return;
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("password", { error: true });
      return;
    }
  }

  // If file has no password
  file.downloadCount++;
  await file.save();
  console.log(file.downloadCount);
  res.download(file.path, file.originalName);
}

// Listen
app.listen(PORT, () =>
  console.log(`Server started at: http://localhost:${PORT}`)
);
