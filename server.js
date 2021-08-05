const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')

app = express()

let sessionOptions = session({
  secret: '#Y3x5#7fSqKD7kkN0*HT0jo#1$bXD',
  store: new MongoStore({ client: require('./db') }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true
  }
})

app.use(sessionOptions)
app.use(flash())

app.use((req, res, next) => {
  // make current user id available on the req object
  if (req.session.user) {
    req.visitorId = req.session.user.id
  } else {
    req.visitorId = 0
  }

  // make user session data available from within view templates
  res.locals.user = req.session.user
  next()
})

const router = require('./router')

// These two lines tell express to accept user data
// from our form or included in the header as json

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use('/', router)

module.exports = app
