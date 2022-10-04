const express = require('express')
const router = express.Router()

const moment = require('moment')

const axios = require('axios')
let CWBAuthorization = process.env.CWBAuthorization
let CWBbaseURL = 'https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/'

// [axios] 處理 x-www-form-urlencoded 格式問題
// https://jeremysu0131.github.io/axios-%E8%99%95%E7%90%86-x-www-form-urlencoded-%E6%A0%BC%E5%BC%8F%E5%95%8F%E9%A1%8C/
// axios 輸出的數據是 json 格式，若我們要轉換成 x-www-form-urlencoded 格式，則需要安裝 qs 這個額外套件
const Qs = require('qs')

const bcrypt = require('bcryptjs')
const { Op } = require("sequelize")
const db = require('../models')
const User = db.User
const UserSave = db.UserSave
const UserNotification = db.UserNotification

// signin 簽發 token
const jwt = require('jsonwebtoken')
const JWT_SECRET = 'secret'

// 進入其他需驗證路由的驗證
const passport = require('../config/passport')
const authenticated = passport.authenticate('jwt', { session: false })

// 定時撈取資料，並發送 Line 訊息
// 設定 Line business messages axios、Line notify(專案沒使用這個)
// let LINE_NOTIFY_TOKEN = process.env.LINE_NOTIFY_TOKEN //(專案沒使用這個)
let LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_TOKEN
const instance = axios.create({
  // baseURL: 'https://notify-api.line.me/api/notify', // line notify-api 使用
  baseURL: 'https://api.line.me/v2/bot/message/push',
  timeout: 1000,
  headers: {
    Authorization: `Bearer ${LINE_CHANNEL_TOKEN}`,
    // "Content-Type": "multipart/form-data", // line notify-api 使用
    // 'X-Line-Retry-Key': process.env.X-Line-Retry-Key, // 回應過一次好像就沒用了，也不需要
    "Content-Type": "application/json",
  },
})
// 氣象局 array 資料中各山岳的 parameterValue ID 與在 array 的 Index 的對照表
const id_index_table = {
  D001: 0,
  D002: 1,
  D003: 2,
  D004: 3,
  D052: 4,
  D053: 5,
  D054: 6,
  D073: 7,
  D076: 8,
  D084: 9,
  D085: 10,
  D090: 11,
  D091: 12,
  D092: 13,
  D093: 14,
  D095: 15,
  D096: 16,
  D097: 17,
  D005: 18,
  D006: 19,
  D007: 20,
  D117: 21,
  D118: 22,
  D119: 23,
  D120: 24,
  D121: 25,
  D122: 26,
  D123: 27,
  D008: 28,
  D010: 29,
  D012: 30,
  D013: 31,
  D015: 32,
  D016: 33,
  D017: 34,
  D019: 35,
  D024: 36,
  D027: 37,
  D087: 38,
  D089: 39,
  D098: 40,
  D099: 41,
  D100: 42,
  D101: 43,
  D009: 44,
  D011: 45,
  D014: 46,
  D018: 47,
  D020: 48,
  D021: 49,
  D022: 50,
  D023: 51,
  D025: 52,
  D026: 53,
  D028: 54,
  D029: 55,
  D030: 56,
  D031: 57,
  D032: 58,
  D033: 59,
  D034: 60,
  D037: 61,
  D038: 62,
  D039: 63,
  D040: 64,
  D041: 65,
  D042: 66,
  D043: 67,
  D044: 68,
  D045: 69,
  D046: 70,
  D061: 71,
  D068: 72,
  D081: 73,
  D082: 74,
  D083: 75,
  D086: 76,
  D088: 77,
  D094: 78,
  D035: 79,
  D036: 80,
  D055: 81,
  D056: 82,
  D057: 83,
  D058: 84,
  D059: 85,
  D060: 86,
  D062: 87,
  D063: 88,
  D064: 89,
  D065: 90,
  D066: 91,
  D067: 92,
  D069: 93,
  D070: 94,
  D071: 95,
  D047: 96,
  D048: 97,
  D049: 98,
  D050: 99,
  D051: 100,
  D072: 101,
  D078: 102,
  D126: 103,
  D127: 104,
  D128: 105,
  D129: 106,
  D130: 107,
  D131: 108,
  D132: 109,
  D133: 110,
  D145: 111,
  D074: 112,
  D075: 113,
  D077: 114,
  D079: 115,
  D146: 116,
  D147: 117,
  D148: 118,
  D149: 119,
  D150: 120,
  D080: 121,
  D102: 122,
  D103: 123,
  D104: 124,
  D105: 125,
  D106: 126,
  D107: 127,
  D108: 128,
  D125: 129,
  D109: 130,
  D110: 131,
  D111: 132,
  D112: 133,
  D113: 134,
  D114: 135,
  D115: 136,
  D116: 137,
  D151: 138,
  D124: 139,
  D134: 140,
  D135: 141,
  D136: 142,
  D137: 143,
  D138: 144,
  D139: 145,
  D140: 146,
  D141: 147,
  D142: 148,
  D143: 149,
  D144: 150
}
// 定時器。定時向使用者傳送天氣資訊 LINE 訊息
const clock = setInterval(fetchDataAndNotify, 5000)
async function fetchDataAndNotify() {
  try {
    // 抓取中央氣象局資料
    let requestURL = `${CWBbaseURL}F-B0053-035?Authorization=${CWBAuthorization}&format=JSON`
    const response = await axios.get(requestURL)

    // 找出未來中最接近現在時間的一筆預報的時間點
    // 因為例如在 10/1 10:28 去撈每三小時的天氣資料，回傳的資料可能是從 10/1 06:00、10/1 09:00、10/1 12:00..開始排序，所以要找到未來中最接近現在時間的一筆預報的時間點，即 10/1 12:00 這筆資料在 time array 中的 Index。
    let timeIndex = 0
    const nowDate = Date.now()
    for (let i = 0; i < response.data.cwbopendata.dataset.locations.location[0].weatherElement[0].time.length; i++) {
      if (nowDate > Date.parse(response.data.cwbopendata.dataset.locations.location[0].weatherElement[0].time[i].dataTime)) {
        timeIndex++
      } else {
        break
      }
    }
    // 該筆預報的時間，如 2022-10-04 12:00
    let dt = response.data.cwbopendata.dataset.locations.location[0].weatherElement[0].time[timeIndex].dataTime.slice(0, 10) + ' ' + response.data.cwbopendata.dataset.locations.location[0].weatherElement[0].time[timeIndex].dataTime.slice(11, 16)

    // 找出所有有開啟的通知設定
    UserNotification.findAll({
      raw: true,
      nest: true,
      include: [{ model: User, where: { LINE_USER_ID: { [Op.not]: '' } } }]
    })
      .then(async (userNotifications) => {
        try {
          Promise.all(userNotifications.map(item => {
            // 判斷選定通知的地點的天氣條件，並發送 Line business messages 訊息
            // 用 item.MountainId 從 id_index_table 找出對應的 mountainIndex；判斷 location[mountainIndex] 的天氣狀況是否要傳送訊息
            const mountainIndex = id_index_table[item.MountainId]
            const LINE_USER_ID = item.User.LINE_USER_ID
            if (Number(response.data.cwbopendata.dataset.locations.location[mountainIndex].weatherElement[3].time[timeIndex].elementValue.value) >= item.rainrate ||
              Number(response.data.cwbopendata.dataset.locations.location[mountainIndex].weatherElement[0].time[timeIndex].elementValue.value) >= item.temperature ||
              Number(response.data.cwbopendata.dataset.locations.location[mountainIndex].weatherElement[8].time[timeIndex].elementValue.value) >= item.apparentTemperature) {
              // 製作訊息 eg.小霸尖山 午後短暫雷陣雨。降雨機率 30%。溫度攝氏14度。寒冷。西北風 平均風速<= 1級(每秒2公尺)。相對濕度72%。
              let message = `${response.data.cwbopendata.dataset.locations.location[mountainIndex].locationName} \n${response.data.cwbopendata.dataset.locations.location[mountainIndex].weatherElement[10].time[0].elementValue.value}`

              // 傳送訊息
              // 解決，如果 LINE_USER_ID 為空，或是 [UnhandledPromiseRejection: This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason "AxiosError: Request failed with status code 400".] { code: 'ERR_UNHANDLED_REJECTION' }
              async function send() {
                try {
                  const LineResponse = await instance.post('/', {
                    to: LINE_USER_ID,
                    messages: [{
                      "type": "text",
                      "text": `To: ${item.User.account}\nTime: ${dt}\n${message}`
                    }]
                  })
                  return LineResponse
                } catch (error) {
                  return
                }
              }
              send()
            }
          }))
          return
        } catch (error) {
          console.warn(error)
          return
        }
      })
  } catch (error) {
    console.warn(error)
    return
  }
}

// line webhook，處理聊天室的使用者事件，如follow、unfollow、message
router.post('/api/line_webhook', async (req, res) => {
  try {
    let LINE_USER_ID = req.body.events[0].source.userId

    // 設定 Line business messages axios
    const LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_TOKEN
    const instance = axios.create({
      baseURL: 'https://api.line.me/v2/bot/message/push',
      timeout: 1000,
      headers: {
        Authorization: `Bearer ${LINE_CHANNEL_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    let message = ''

    switch (req.body.events[0].type) {
      case 'follow':
        message = '成功加入好友'
        break
      case 'unfollow':
        // unfollow: 刪除在 User 資料表中的 LINE_USER_ID
        // message = '退訂成功'
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
        return
      case 'message':
        message = '您好~'
        break
    }

    // 不知為何，每隔約 1 分鐘就會收到一次 follow、unfollow 事件；所以先關到後續處理
    return
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

router.get('/api/weather_data', async (req, res) => {
  try {
    let requestURL = `${CWBbaseURL}${req.query.dataCategory}?Authorization=${CWBAuthorization}&format=${req.query.dataType}`
    const response = await axios.get(requestURL)
    if (response.status === 200) {
      return res.json({ status: 'success', message: 'test ok', dataset: { ...response.data.cwbopendata.dataset } })
    } else {
      return res.status.json({ status: 'error', message: '無法取得氣象資料' })
    }
  } catch (error) {
    console.warn(error)
    return res.json({ status: 'error', message: '伺服器內部問題' })
  }
})

router.post('/api/users/signup', (req, res) => {
  // 取得前端表單資料
  const { account, password } = req.body

  // 表單資料有缺漏，或是password, checkPassword 不一致時，return
  if (!account || !password) {
    return res.status.json({ status: 'error', message: 'account, password 資料缺漏' })
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
      return res.json({ status: 'error', message: '伺服器內部問題' })
    })
})

router.post('/api/users/signin', (req, res) => {
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
        return res.json({ status: 'error', message: '密碼錯誤' })
      }

      // 簽發token
      const payload = { id: user.id }
      const token = jwt.sign(payload, JWT_SECRET)

      // 只回傳必要資訊，其他如 password、createdAt 就不需要回傳到前端
      user = {
        id: user.id,
        account: user.account,
        LINE_USER_ID: user.LINE_USER_ID || null
      }

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
      return res.json({ status: 'error', message: '伺服器內部問題' })
    })
})

router.get('/api/get_current_user', authenticated, (req, res) => {
  // JWT驗證後從資料庫撈出的 req.user
  // 這邊的資料屬性要和 /config/passport.js 定義的一致
  return res.json({
    id: req.user.id,
    account: req.user.account,
    LINE_USER_ID: req.user.LINE_USER_ID || null
  })
})

router.get('/api/users/userSave', authenticated, (req, res) => {
  const userId = req.user.id
  UserSave.findAll({ where: { UserId: userId } })
    .then(userSaves => {
      return res.json({ status: 'success', userSaves: userSaves })
    })
    .catch(error => {
      console.log(error)
      return res.json({ status: 'error', message: '伺服器內部問題' })
    })
})

router.post('/api/users/addToUserSave', authenticated, (req, res) => {
  UserSave.create({
    UserId: req.user.id,
    MountainId: req.body.MountainId
  })
    .then(() => {
      return res.json({ status: 'success' })
    })
    .catch(error => {
      console.log(error)
      return res.json({ status: 'error', message: '伺服器內部問題' })
    })
})

router.post('/api/users/removeFromUserSave', authenticated, (req, res) => {
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
      return res.json({ status: 'error', message: '伺服器內部問題' })
    })
})

router.get('/api/users/notification', authenticated, (req, res) => {
  UserNotification.findOne({ where: { UserId: req.user.id } })
    .then(userNotification => {
      return res.json({ status: 'success', userNotification: userNotification })
    })
    .catch(error => {
      console.log(error)
      return res.json({ status: 'error', message: '伺服器內部問題' })
    })
})

router.post('/api/users/onNotify', authenticated, (req, res) => {
  // 如果沒有開啟通知，則新增；如果已有開啟通知，則更新新的監控地點、條件
  UserNotification.findOne({ where: { UserId: req.user.id } })
    .then(userNotification => {
      if (!userNotification) {
        UserNotification.create({
          UserId: req.user.id,
          MountainId: req.body.MountainId,
          temperature: req.body.temperature.value,
          apparentTemperature: req.body.apparentTemperature.value,
          rainrate: req.body.rainrate.value
        })
      } else {
        userNotification.update({
          UserId: req.user.id,
          MountainId: req.body.MountainId,
          temperature: req.body.temperature.value,
          apparentTemperature: req.body.apparentTemperature.value,
          rainrate: req.body.rainrate.value
        })
      }
    })
    .then(() => {
      return res.json({ status: 'success' })
    })
    .catch(error => {
      console.log(error)
    })
})

router.post('/api/users/offNotify', authenticated, (req, res) => {
  UserNotification.findOne({ where: { UserId: req.user.id, MountainId: req.body.MountainId } })
    .then(userNotification => {
      userNotification.destroy()
        .then(() => {
          return res.json({ status: 'success' })
        })
    })
    .catch(error => {
      console.log(error)
    })
})

// Line Login Platform 把資料發回來，取得 query.code、query.state
router.get('/api/auth/line/callback', async (req, res) => {
  try {
    if (req.query) {
      // 透過 query.code (authorization code) 向 Line platform request 使用者資料(line user)
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
    // 透過 query.code (authorization code) 向 Line platform request 使用者資料(line user)
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
        return 'DONE: databaseResult'
      })
      .catch(async (error) => {
        console.log(error)
        return 'ERROR: databaseResult'
      })
    return databaseResult
  } catch (error) {
    console.log(error)
  }
}

module.exports = router
