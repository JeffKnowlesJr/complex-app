const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')
const consoleMiddleware = require('./middleware/console')

const apiRouter = require('express').Router()

apiRouter.post('/login', userController.apiLogin)

module.exports = apiRouter
