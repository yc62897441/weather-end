if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000

// cors 的預設為全開放
app.use(cors())

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// const session = require('express-session')
// // 使用 app.use() 註冊套件，並使用 session(option) 來設定相關選項
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true
// }))

// // 載入設定檔，要寫在 express-session 以後
// const usePassport = require('./config/passport')
// // 呼叫 Passport 函式並傳入 app，這條要寫在路由之前
// usePassport(app)

const routes = require('./routes/index')

// 設定本地變數 res.locals
// 放在 res.locals 裡的資料，所有的 view 都可以存取
// app.use((req, res, next) => {
//   res.locals.isAuthenticated = req.isAuthenticated()
//   // req.user 是在反序列化的時候，取出的 user 資訊，之後會放在 req.user 裡以供後續使用
//   res.locals.user = req.user
//   // res.locals.success_msg = req.flash('success_msg') // 設定 success_msg 訊息
//   // res.locals.warning_msg = req.flash('warning_msg') // 設定 warning_msg 訊息
//   next()
// })

// 連線總伺服器
app.use(routes)

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`)
})

// const router = require('./routes')
// router(app)
// module.exports = app
