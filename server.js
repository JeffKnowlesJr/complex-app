const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')
const dotenv = require('dotenv')

dotenv.config()

app = express()

let sessionOptions = session({
  secret: process.env.SESSION_SECRET,
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
  // make our markdown function available from within ejs templates
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(markdown(content), {
      allowedTags: [
        'p',
        'br',
        'ul',
        'ol',
        'li',
        'strong',
        'em',
        'bold',
        'i',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6'
      ],
      allowedAttributes: {}
    })
  }

  // make all error and success flash messages available to views
  res.locals.errors = req.flash('errors')
  res.locals.success = req.flash('success')

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

const server = require('http').createServer(app)

const io = require('socket.io')(server)

io.on('connection', function (socket) {
  socket.on('chatMessageFromBrowser', (data) => {
    io.emit('chatMessageFromServer', { message: data.message })
  })
})

module.exports = server
