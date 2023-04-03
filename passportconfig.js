// we create a new local strategy
const LocalStrategy = require('passport-local').Strategy;

// we need bycrypt to hash the password
const bcrypt = require('bcrypt');

function initialise(passport, getUserByEmail, getUserById) {
  // we have a function that authenticates the user
  async function authenticateUser(email, password, done) {
    // get the user by email
    const user = getUserByEmail(email);
    if (user == null) {
      // done 1st parameter is the error, 2nd is the user we found, 3rd is message
      // we don't have an error setup, and we found no user
      return done(null, false, { message: 'No user with that email' });
    }

    try {
      // we compare the password our user sent in on login, and the stored password
      if (await bcrypt.compare(password, user.password)) {
        // we return a null error, and the user that we want to autheticate with (the user they have logged in as)
        return done(null, user);
      } else {
        // we return a null error, and false for a user, and a message
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (error) {
      // we return the error
      return done(error);
    }
  }
  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));
  passport.serializeUser((user, done) => {
    // we get the users id and save that into our session
    // so we pass it into the done function, and null is the error, and user.id is our user
    return done(null, user.id);
  });
  passport.deserializeUser((id, done) => {
    // https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
    return done(null, getUserById(id));
  });
}

// we export this initialise function to use it in server.js
module.exports = initialise;
