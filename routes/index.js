const axios = require('axios')
let CWBAuthorization = process.env.CWBAuthorization
let CWBbaseURL = 'https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/'

const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const UserSave = db.UserSave

// signin 簽發 token
const jwt = require('jsonwebtoken')
const JWT_SECRET = 'secret'
// 進入其他需驗證路由的驗證
const passport = require('../config/passport')
const authenticated = passport.authenticate('jwt', { session: false })

module.exports = (app) => {
  app.get('/api/test', async (req, res) => {
    try {
      let requestURL = `${CWBbaseURL}${req.query.dataCategory}?Authorization=${CWBAuthorization}&format=${req.query.dataType}`
      const response = await axios.get(requestURL)
      if (response.status === 200) {
        return res.json({ status: 'success', message: 'test ok', dataset: { ...response.data.cwbopendata.dataset } })
      } else {
        return res.status(401).json({ status: 'error', message: '無法取得氣象資料' })
      }
    } catch (error) {
      console.warn(error)
    }
  })

  app.post('/api/users/signup', (req, res) => {
    // 取得前端表單資料
    const { account, password } = req.body

    // 表單資料有缺漏，或是password, checkPassword 不一致時，return
    if (!account || !password) {
      return res.status(401).json({ status: 'error', message: 'account, password 資料缺漏' })
    }

    User.findOne({ where: { account: account } })
      .then(user => {
        if (user) {
          return res.json({ status: 'account_exist', message: '帳號已經存在' })
        }

        User.create({
          account: account,
          password: bcrypt.hashSync(password, bcrypt.genSaltSync(10))
        })
          .then(user => {
            return res.json({ status: 'success', message: '註冊成功' })
          })
      })
      .catch(error => {
        console.warn(error)
      })
  })

  app.post('/api/users/signin', (req, res) => {
    // 取得前端表單資料
    const { account, password } = req.body
    if (!account || !password) {
      return res.json({ status: 'error', message: '請輸入 account 與 password' })
    }

    User.findOne({ where: { account: account } })
      .then(user => {
        if (!user) {
          return res.json({ status: 'error', message: '不存在此 account' })
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return res.status(401).json({ status: 'error', message: '密碼錯誤' })
        }

        // 簽發token
        const payload = { id: user.id }
        const token = jwt.sign(payload, JWT_SECRET)

        // 回傳訊息、token、user data
        return res.json({
          status: 'success',
          message: '登入驗證成功',
          token: token,
          user: user
        })
      })
      .catch(error => {
        console.log(error)
      })
  })

  app.get('/api/get_current_user', authenticated, (req, res) => {
    // JWT驗證後從資料庫撈出的 req.user
    // 這邊的資料屬性要和 /config/passport.js 定義的一致
    return res.json({
      id: req.user.id,
      account: req.user.account,
    })
  })

  app.get('/api/users/userSave', authenticated, (req, res) => {
    const userId = req.user.id
    UserSave.findAll({ where: { UserId: userId }})
    .then(userSaves => {
      return res.json({ status: 'success', userSaves: userSaves })
    })
    .catch(error => {
      console.log(error)
      return res.status(505).json({ status: 'error' })
    })
  })

  app.post('/api/users/addToUserSave', authenticated, (req, res) => {
    UserSave.create({
      UserId: req.user.id,
      MountainId: req.body.MountainId
    })
      .then(() => {
        return res.json({ status: 'success' })
      })
      .catch(error => {
        console.log(error)
        return res.status(505).json({ status: 'error' })
      })
  })

  app.post('/api/users/removeFromUserSave', authenticated, (req, res) => {
    UserSave.findOne({
      where: {
        UserId: req.user.id,
        MountainId: req.body.MountainId
      }
    })
      .then(userSave => {
        userSave.destroy()
          .then(() => {
            return res.json({ status: 'success' })
          })
      })
      .catch(error => {
        console.log(error)
        return res.status(505).json({ status: 'error' })
      })
  })
}
