if (process.env.NODE_ENV !== 'production') {
  // this loads in all our environment variables and sets them inside process.env
  require('dotenv').config();
}

const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const session = require('express-session');
const flash = require('express-flash');
const methodOverride = require('method-override');

const PORT = process.env.PORT || 3000;

const initalisePassport = require('./passportconfig');

initalisePassport(
  // this is the passport that we are configuring
  passport,
  // this is function getUserByEmail that we use to find our user based on the email
  (email) => users.find((user) => user.email === email),
  // this is function getUsersById that we use to find our user based on the id
  (id) => users.find((user) => user.id === id)
);

// this is our fake database
const users = [];

// use a public static folder
app.use(express.static('public'));

// use the EJS templating language
app.set('view-engine', 'ejs');

// this parses the body from an html form
// so we can access them inside of the request
app.use(express.urlencoded({ extended: false }));

// this is for flash messages
app.use(flash());

// this is for user sessions
app.use(
  session({
    // the first option is a secret
    secret: process.env.SESSION_SECRET,
    // should we re-save our session vairiables if nothing has changed
    resave: false,
    // do you want to save an empty value in the session if there is no value
    saveUninitialized: false,
  })
);

// initialize is a function inside passport which sets up the basics for us
app.use(passport.initialize());

// we want to store our variables to be persisted across the entire session our user has
// which will work with the app.use(session({})) above
app.use(passport.session());

// use method-override to allow us to understand a delete request from a form
// we pass what we want our method override to be, this is what we will pass for our method
app.use(methodOverride('_method'));

app.get('/', checkIsAuthenticated, (req, res) => {
  // with sessions, the req.user is always going to be sent with the user that is authenticated
  res.render('index.ejs', { name: req.user.name });
});

app.get('/login', checkIsNotAuthenticated, (req, res) => {
  res.render('login.ejs');
});

// we don't need the (req, res) function anymore, we use the passport authentication middleware
// app.post('/login', (req, res) => {});
// we want to use the local Strategy
// and pass it a list of options for things we want to modify
app.post(
  '/login',
  checkIsNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    // this sets the flash message on failure which is defined in passportconfig.js in the format { message: "bla bla" }
    failureFlash: true,
  })
);

app.get('/register', checkIsNotAuthenticated, (req, res) => {
  res.render('register.ejs');
});

app.post('/register', checkIsNotAuthenticated, async (req, res) => {
  try {
    // hash the password with bycrypt
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    res.redirect('/login');
  } catch (error) {
    res.redirect('/register');
  }
  console.log(users);
});

app.delete('/logout', (req, res, next) => {
  // passport sets up this logOut function automatically, it will clear the session and log our user out
  // req.logOut is ASYNCHRONOUS
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});

// this is our own middleware function, it takes a req, a res, and a next which we call whenever we are done
function checkIsAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    // if they are authenticated, we want to continue
    return next();
  }
  // if they are not authenticated redirect them to the login page
  res.redirect('/login');
}

function checkIsNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    // if they are authenticated redirect them to the home page
    return res.redirect('/');
  }
  // if they are not authenticated, we want to continue
  next();
}

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
