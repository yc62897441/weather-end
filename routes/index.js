const axios = require('axios')
let CWBAuthorization = process.env.CWBAuthorization
let CWBbaseURL = 'https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/'

const bcrypt = require('bcryptjs')
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
// Line notify axios
let LINENOTIFYTOKEN = process.env.LINENOTIFYTOKEN
const instance = axios.create({
  baseURL: 'https://notify-api.line.me/api/notify',
  timeout: 1000,
  headers: {
    Authorization: LINENOTIFYTOKEN,
    "Content-Type": "multipart/form-data"
  },
})
// 對照表
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
// 定時器
const clock = setInterval(fetchDataAndNotify, 5000);
async function fetchDataAndNotify() {
  try {
    // 抓取中央氣象局資料
    let requestURL = `${CWBbaseURL}F-B0053-035?Authorization=${CWBAuthorization}&format=JSON`
    const response = await axios.get(requestURL)

    UserNotification.findAll({ raw: true, nest: true })
      .then(userNotifications => {
        // 找出所有有開啟的通知設定
        userNotifications.forEach(async (item) => {
          try {
            // 判斷選定通知的地點的天氣條件，並發送 Line notify 訊息
            const mountainIndex = id_index_table[item.MountainId]
            if (Number(response.data.cwbopendata.dataset.locations.location[mountainIndex].weatherElement[3].time[0].elementValue.value) >= item.rainrate || Number(response.data.cwbopendata.dataset.locations.location[mountainIndex].weatherElement[0].time[0].elementValue.value) >= item.temperature || Number(response.data.cwbopendata.dataset.locations.location[mountainIndex].weatherElement[8].time[0].elementValue.value) >= item.apparentTemperature) {
              let message = `\n${response.data.cwbopendata.dataset.locations.location[mountainIndex].locationName} \n${response.data.cwbopendata.dataset.locations.location[mountainIndex].weatherElement[10].time[0].elementValue.value}`
              const response2 = await instance.post('/', { message: message })
            } 
          } catch (error) {
            console.warn(error)
          }
        })
      })
  } catch (error) {
    console.warn(error)
  }
}

module.exports = (app) => {
  app.get('/api/weather_data', async (req, res) => {
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

  app.post('/api/users/signup', (req, res) => {
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
          return res.json({ status: 'error', message: '密碼錯誤' })
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
        return res.json({ status: 'error', message: '伺服器內部問題' })
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
    UserSave.findAll({ where: { UserId: userId } })
      .then(userSaves => {
        return res.json({ status: 'success', userSaves: userSaves })
      })
      .catch(error => {
        console.log(error)
        return res.json({ status: 'error', message: '伺服器內部問題' })
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
        return res.json({ status: 'error', message: '伺服器內部問題' })
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
        return res.json({ status: 'error', message: '伺服器內部問題' })
      })
  })

  app.get('/api/users/notification', authenticated, (req, res) => {
    UserNotification.findOne({ where: { UserId: req.user.id } })
      .then(userNotification => {
        return res.json({ status: 'success', userNotification: userNotification })
      })
      .catch(error => {
        console.log(error)
        return res.json({ status: 'error', message: '伺服器內部問題' })
      })
  })

  app.post('/api/users/onNotify', authenticated, (req, res) => {
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

  app.post('/api/users/offNotify', authenticated, (req, res) => {
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
}
