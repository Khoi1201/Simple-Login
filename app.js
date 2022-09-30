require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 14;

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const dbName = "userDB";

const uri =
  "mongodb+srv://" +
  username +
  ":" +
  password +
  "@0selflearningnodejs.fyag25c.mongodb.net/" +
  dbName +
  "?retryWrites=true&w=majority";
mongoose.connect(uri);

const userSchema = mongoose.Schema({
  email: String,
  password: String,
});

// mongoose model

const User = mongoose.model("User", userSchema);

// do things

app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new User({
      email: req.body.username,
      password: hash,
    });
    newUser.save((err) => {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ email: username }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        bcrypt.compare(
          password,
          foundUser.password,
          function (err, result) {
            if (result === true) {
              res.render("secrets");
            }
          }
        );
      }
    }
  });
});

// start server

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
