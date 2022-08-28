const axios = require('axios')
let CWBAuthorization = process.env.CWBAuthorization
let CWBbaseURL = 'https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/'

module.exports = (app) => {
  app.get('/api/test', async (req, res) => {
    try {
      let requestURL = `${CWBbaseURL}${req.query.dataCategory}?Authorization=${CWBAuthorization}&format=${req.query.dataType}`
      const response = await axios.get(requestURL)
      if (response.status === 200) {
        return res.json({ status: 'success', message: 'test ok', data: { ...response.data } })
      } else {
        return res.status(401).json({ status: 'error', message: '無法取得氣象資料' })
      }
    } catch (error) {
      console.warn(error)
    }
  })
}
