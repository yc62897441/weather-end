const passport = require('passport')
const passportJWT = require('passport-jwt')
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

const jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
jwtOptions.secretOrKey = 'secret'

const db = require('../models')
const User = db.User

const strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  User.findByPk(jwt_payload.id)
    .then(user => {
      if (!user) {
        return next(null, false)
      }
      return next(null, user)
    })
})

passport.use(strategy)

module.exports = passport
