// const Post = require('../models/Post')

exports.viewCreateScreen = (req, res) => {
  res.render('create-post', {
    avatar: req.session.user.avatar,
    username: req.session.user.username
  })
}
