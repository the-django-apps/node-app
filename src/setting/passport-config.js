const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const User = require('../model/users')

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    const user = await User.findOne({email})
    if (user == null) {
      return done(null, false, { message: 'Unable to login' })
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Unable to login' })
      }
    } catch (e) {
      return done(e)
    }
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser(function (id, cb) {
    User.findById(id, function (err, user) {
        cb(err, user);
    });
})
}

module.exports = initialize