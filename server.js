const express = require('express')

const router = require('./router')

app = express()

// These two lines tell express to accept user data
// from our form or included in the header as json

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use('/', router)

module.exports = app
