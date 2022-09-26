const express = require('express')
const router = express.Router()

const axios = require('axios')
// [axios] 處理 x-www-form-urlencoded 格式問題
// https://jeremysu0131.github.io/axios-%E8%99%95%E7%90%86-x-www-form-urlencoded-%E6%A0%BC%E5%BC%8F%E5%95%8F%E9%A1%8C/
// axios 輸出的數據是 json 格式，若我們要轉換成 x-www-form-urlencoded 格式，則需要安裝 qs 這個額外套件
const Qs = require('qs')

const jwt = require('jsonwebtoken')

const db = require('../../models')
const User = db.User

// line webhook，處理聊天室的使用者事件，如follow、unfollow、message
router.post('/line_webhook', async (req, res) => {
  try {
    let LINE_USER_ID = req.body.events[0].source.userId

    // 設定 Line business messages axios
    let LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_TOKEN
    let message = ''
    const instance = axios.create({
      baseURL: 'https://api.line.me/v2/bot/message/push',
      timeout: 1000,
      headers: {
        Authorization: `Bearer ${LINE_CHANNEL_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    switch (req.body.events[0].type) {
      case 'follow':
        message = '成功加入好友'
        break
      case 'unfollow':
        // unfollow: 刪除在 User 資料表中的 LINE_USER_ID
        message = '退訂成功'
        User.findOne({ where: { LINE_USER_ID: LINE_USER_ID } })
          .then(user => {
            if (user) {
              user.update({ LINE_USER_ID: '' })
            }
            return
          })
          .catch(error => {
            console.log(error)
            return
          })
        break
      case 'message':
        message = '您好~'
        break
    }

    const LineResponse = await instance.post('/', {
      to: LINE_USER_ID,
      messages: [
        {
          "type": "text",
          "text": message
        }
      ]
    })
    return
  } catch (error) {
    console.log(error)
    return
  }
})

// Line Login 把資料發回來
router.get('/auth/line/callback', async (req, res) => {
  try {
    if (req.query) {
      if (req.query.state && req.query.code) {
        const getLineUserInfoResult = await getLineUserInfo(req.query.code, req.query.state.trim())
      }
    } else {
      return res.redirect('https://yc62897441.github.io/weather-front?error')
    }

    // 成功: redirect
    return res.redirect('https://yc62897441.github.io/weather-front/#/?success_message=Line_login_success')
  } catch (error) {
    console.log(error)
    return res.redirect('https://yc62897441.github.io/weather-front/#/?error_message=Line_login_fail')
  }
})

async function getLineUserInfo(code, state) {
  try {
    // 先註解起來：開發檢視用，建立處理訊息，傳送給自己的 LINE 看各階段處理狀況、資料取得情況
    // let message = 'getLineUserInfo \n'

    // 透過 code (authorization code) 向 Line platform request 使用者資料(line user)
    const data = {
      grant_type: 'authorization_code',
      code: code.trim(),
      redirect_uri: process.env.LINE_LOGIN_CALLBACK,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET
    }

    // [axios] 處理 x-www-form-urlencoded 格式問題
    // https://jeremysu0131.github.io/axios-%E8%99%95%E7%90%86-x-www-form-urlencoded-%E6%A0%BC%E5%BC%8F%E5%95%8F%E9%A1%8C/
    // axios 輸出的數據是 json 格式，若我們要轉換成 x-www-form-urlencoded 格式，則需要安裝 qs 這個額外套件
    // 取得回傳資料
    const response = await axios.post('https://api.line.me/oauth2/v2.1/token', Qs.stringify(data), {
      Headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })

    // 可以從回傳資料中的 id_token 解析出 line user 的資訊，接下來把 line user id 存到資料庫中了
    const token = response.data.id_token
    const decoded = jwt.decode(token)

    // 把 line user id 存到資料庫中
    // state 是 A unique alphanumeric string，Line 要求我們的 app 自隨機產生。這邊我在前端把 user account 帶給 state 當成值，所以現在可以用 state 去找到 user
    const databaseResult = await User.findOne({ where: { account: state } })
      .then(async (user) => {
        user.update({
          LINE_USER_ID: decoded.sub
        })
        // message = message + `user.account: ${user.account} \n`
        // message = message + `user.LINE_USER_ID: ${user.LINE_USER_ID} \n`
        // sendLine(message)
        return 'DONE: databaseResult'
      })
      .catch(async (error) => {
        console.log(error)
        // message = message + `User.findOne Error \n`
        // sendLine(message)
        return 'ERROR: databaseResult'
      })
    return databaseResult
  } catch (error) {
    console.log(error)
  }
}

// 先註解起來：開發檢視用，建立處理訊息，傳送給自己的 LINE 看各階段處理狀況、資料取得情況
// async function sendLine(message) {
//   try {
//     const LINE_USER_ID = process.env.LINE_USER_ID
//     const LineResponse = await instance.post('/', {
//       to: LINE_USER_ID,
//       messages: [{
//         "type": "text",
//         "text": `${message}`
//       }]
//     })
//     return 'DONE: sendLine'
//   } catch (error) {
//     console.log(error)
//   }
// }

module.exports = router
