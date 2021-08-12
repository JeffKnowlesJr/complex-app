const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')
const postController = require('./controllers/postController')
const followController = require('./controllers/followController')

// User related routes
router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

// Post related routes
router.get('/create-post', userController.auth, postController.viewCreateScreen)
router.post('/create-post', userController.auth, postController.create)
router.get('/post/:id', postController.viewSingle)
router.get('/post/:id/edit', userController.auth, postController.viewEditScreen)
router.post('/post/:id/edit', userController.auth, postController.edit)
router.post('/post/:id/delete', userController.auth, postController.delete)
router.post('/search', postController.search)

// Profile related routes
router.get(
  '/profile/:username',
  userController.ifUserExists,
  userController.sharedProfileData,
  userController.profilePostsScreen
)

// Follow related routes
router.post(
  '/addFollow/:username',
  userController.auth,
  followController.addFollow
)
router.post(
  '/removeFollow/:username',
  userController.auth,
  followController.removeFollow
)

module.exports = router
