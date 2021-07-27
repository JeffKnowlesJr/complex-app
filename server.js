const express = require('express')

const router = require('./router')

const PORT = process.env.PORT || 3000

app = express()

app.use(express.static('public'))
app.set('views', 'templates')
app.set('view engine', 'ejs')

app.use('/', router)

app.listen(PORT)
