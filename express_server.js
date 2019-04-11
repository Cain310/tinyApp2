const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

function generateRandomString() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 7; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function retrieveUser(email, password) {
  for (username in users) {
    let userEmail = users[username]["email"];
    let userPassword = users[username]["password"];
    if (email === userEmail && password === userPassword) {
      return users[username];
    }
  }
  return false;
}

function checkEmail(email) {
  for (var userEmail in users) {
    if (userEmail[userId].email === email) {
      return userEmail;
    }
  }
  return false;
}

app.get("/", (req, res) => {
  res.send("Hello! This should be your home page but it is not...");
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, users: users[req.cookies["userId"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { users: users[req.cookies["userId"]] };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { users: users[req.cookies["userId"]] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, users: users[req.cookies["userId"]] };
  res.render("urls_login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    users: users[req.cookies["userId"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const i = generateRandomString();
  urlDatabase[i] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const i = generateRandomString();
  const { email, password } = req.body;
  const newUser = {
    id: i,
    email,
    password
  };

  if (retrieveUser(email, password)) {
    res.status(400).send("You are already a registered user");
  } else if (!email || !password) {
    res.redirect("/register");
  } else {
    users[i] = newUser;
    res.cookie("userId", i);
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const user = retrieveUser(req.body.email, req.body.password);
  if (user) {
    res.cookie("userId", user.id);
    res.redirect("/urls");
  } else {
    res.status(400).send("THOU shalt not pass");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("userId");
  res.redirect("/login");
});

app.post("/urls/:shortURL/Delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL/", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;

  res.redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
