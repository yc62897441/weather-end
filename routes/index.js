const axios = require('axios')
let CWBAuthorization = process.env.CWBAuthorization
let CWBbaseURL = 'https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/'

const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User

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
}
