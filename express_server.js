const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.use(express.static("public"));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1s", "key2s"]
  })
);

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  lsm5xK: { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: genHashPassword("purple-monkey-dinosaur")
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: genHashPassword("dishwasher-funk")
  }
};
function genHashPassword(value) {
  return (hashedPassword = bcrypt.hashSync(value, 10));
}

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
    let userPassword = bcrypt.compareSync(
      password,
      users[username]["password"]
    );
    if (email === userEmail && userPassword) {
      return users[username];
    }
  }
  return false;
}

function userUrls(userId) {
  let urls = {};
  for (shorturl in urlDatabase) {
    if (userId === urlDatabase[shorturl].userID) {
      urls[shorturl] = urlDatabase[shorturl];
    }
  }
  return urls;
}

app.get("/", (req, res) => {
  res.send("Hello! This should be your home page but it is not...");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    users: users[req.session["userId"]],
    urls: userUrls(req.session["userId"])
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { users: users[req.session["userId"]] };
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { users: users[req.session["userId"]] };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, users: users[req.session["userId"]] };
  res.render("urls_login", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    users: users[req.session["userId"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  const i = generateRandomString();
  urlDatabase[i] = {
    longURL: req.body.longURL,
    userID: req.session["userId"]
  };
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const i = generateRandomString();
  const { email, password } = req.body;

  const newUser = {
    id: i,
    email,
    password: hashedPassword
  };

  if (retrieveUser(email, password)) {
    res.status(400).send("You are already a registered user");
  } else if (!email || !password) {
    res.redirect("/register");
  } else {
    users[i] = newUser;
    req.session.userId = i;
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  const user = retrieveUser(req.body.email, req.body.password);
  if (user) {
    req.session.userId = user.id;
    res.redirect("/urls");
  } else {
    res.status(400).send("THOU shalt not pass");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = urlDatabase[req.params.shortURL].userID;
  if (userId === req.session["userId"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(400).send("Can't Delete URL");
  }
});

app.post("/urls/:shortURL/", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;

  res.redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
