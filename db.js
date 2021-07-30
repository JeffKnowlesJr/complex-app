const mongodb = require('mongodb')
const dotenv = require('dotenv')

dotenv.config()

const PORT = process.env.PORT || 3000
const MONGO_URI = process.env.DB_URI

// Express app will not start until we've already connected
// to the DB
mongodb.connect(
  MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err, client) => {
    if (err) {
      return console.error(err)
    }
    module.exports = client.db()
    const app = require('./server')
    app.listen(PORT, () => {
      console.log(`Listening on port: ${PORT}`)
    })
  }
)
