require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "process.env.DB_SEC",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize()); // initialize passport
app.use(passport.session()); // use passport to set up sessions // see passportjs.org

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

userSchema.plugin(passportLocalMongoose); // hash and salt password
userSchema.plugin(findOrCreate);

// mongoose model

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID_2,
      clientSecret: process.env.CLIENT_SECRET_2,
      callbackURL: "https://localhost:3000/oauth2/redirect/google",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log("login success");
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// do things

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login/google", (req, res) => {
  passport.authenticate("google", {
    scope: ["email"],
  });
  // use passport to authenticate user using google strategy
});

app.get("/home", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, newUser) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  // come from passport
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

// start server

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
