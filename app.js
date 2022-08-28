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

app.listen(port, () => {
  console.log(`App is running on http://localhost:${port}`)
})

const router = require('./routes')
router(app)
module.exports = app
