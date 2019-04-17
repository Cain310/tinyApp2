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

// Hardcoded url database
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  lsm5xK: { longURL: "http://www.google.com", userID: "user2RandomID" }
};

//Hardcoded user database
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
//Helper functions here
//generates a hashed password using bcrypt
function genHashPassword(value) {
  return (hashedPassword = bcrypt.hashSync(value, 10));
}

//Generates a random string of 6 letters and numbers
function generateRandomString() {
  let text = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 7; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

//Retrieves user info to cross refernce against input login registration user data.
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

//Function that makes sure the user is logged in to view urls on main urls page.
function userUrls(userId) {
  let urls = {};
  for (shorturl in urlDatabase) {
    if (userId === urlDatabase[shorturl].userID) {
      urls[shorturl] = urlDatabase[shorturl];
    }
  }
  return urls;
}


//All GET routes here
app.get("/", (req, res) => {
  res.send("Hello! This should be your home page but it is not...");
});

//Main urls page where only logged in user can create edit or delete urls.
app.get("/urls", (req, res) => {
  let templateVars = {
    users: users[req.session["userId"]],
    urls: userUrls(req.session["userId"])
  };
  res.render("urls_index", templateVars);
});

//Page where logged in registered user can create or add new urls to there profile.
app.get("/urls/new", (req, res) => {
  let templateVars = { users: users[req.session["userId"]] };
  res.render("urls_new", templateVars);
});

//register page users who are not already registered can register.
app.get("/register", (req, res) => {
  let templateVars = { users: users[req.session["userId"]], showLogin: false };
  res.render("urls_register", templateVars);
});

//Login page where only registered users can login
app.get("/login", (req, res) => {
  let templateVars = { urls: urlDatabase, users: users[req.session["userId"]] };
  res.render("urls_login", templateVars);
});

//short urls verification page.
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

//All POST routes here
app.post("/urls", (req, res) => {
  const i = generateRandomString();
  urlDatabase[i] = {
    longURL: req.body.longURL,
    userID: req.session["userId"]
  };
  res.redirect("/urls");
});

//register page where the magic happens encrypts passwords and randomizes id's, pushes input object to fake database
//error messages and redirect when succesful.
app.post("/register", (req, res) => {
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const randomID = generateRandomString();
  const { email, password } = req.body;
  const newUser = {
    id: randomID,
    email,
    password: hashedPassword
  };

  if (retrieveUser(email, password)) {
    res.status(400).send("You are already a registered user");
  } else if (!email || !password) {
    res.send("UH OH Please try Again!");
  } else {
    users[hashedPassword] = newUser;
    req.session.userId = hashedPassword;
    res.redirect("/urls");
  }
});

//Login page retrieve users who have already registered using the helper function up top. Error messages if not already registered.
app.post("/login", (req, res) => {
  const user = retrieveUser(req.body.email, req.body.password);
  if (user) {
    req.session.userId = user.id;
    res.redirect("/urls");
  } else {
    res.status(400).send("THOU shalt not pass");
  }
});

//Logout button application, redirects to login and deletes session encrypted cookie.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//Delete urls that only belong to specific longed in user. cookies verify users.
app.post("/urls/:shortURL/delete", (req, res) => {
  const userId = urlDatabase[req.params.shortURL].userID;
  if (userId === req.session["userId"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.status(400).send("Can't Delete URL");
  }
});

//working short url link to long url.
app.post("/urls/:shortURL/", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
