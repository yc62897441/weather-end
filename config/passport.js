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
      user = {
        id: user.id,
        account: user.account
        // LINE_USER_ID: user.LINE_USER_ID
      }
      return next(null, user)
    })
})

passport.use(strategy)

module.exports = passport

// const passport = require('passport')
// const LineStrategy = require('passport-line').Strategy

// const axios = require('axios')

// module.exports = app => {
//   // 初始化 Passport 模組
//   app.use(passport.initialize())
//   app.use(passport.session())

//   // 設定 Facebook 登入策略
//   passport.use(new LineStrategy({
//     channelID: process.env.LINE_LOGIN_CHANNEL_ID,
//     channelSecret: process.env.LINE_LOGIN_CHANNEL_SECRET,
//     callbackURL: process.env.LINE_LOGIN_CALLBACK,
//   }, async (accessToken, refreshToken, profile, done) => {
//     try {
//       let LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_TOKEN
//       let LINE_USER_ID = process.env.LINE_USER_ID

//       // let message = `accessToken: ${accessToken} \n refreshToken: ${refreshToken} \n profile: ${profile.id} \n`
//       let message = 'passport'

//       const instance = axios.create({
//         baseURL: 'https://api.line.me/v2/bot/message/push',
//         timeout: 1000,
//         headers: {
//           Authorization: `Bearer ${LINE_CHANNEL_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       })

//       const LineResponse = await instance.post('/', {
//         to: LINE_USER_ID,
//         messages: [
//           {
//             "type": "text",
//             "text": message
//           }
//         ]
//       })

//       return done(null, { id: 1, name: 'test' })
//     } catch (error) {
//       console.log(error)
//       done(error, false)
//     }
//   }
//   ))

//   // 設定序列化與反序列化
//   passport.serializeUser((user, done) => {
//     done(null, user.id)
//   })
//   passport.deserializeUser((id, done) => {
//     done(null, { id: 1, name: 'test' })
//   })
// }