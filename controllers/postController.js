const Post = require('../models/Post')

exports.viewCreateScreen = (req, res) => {
  res.render('create-post')
}

exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user.id)
  post
    .create()
    .then(() => {
      res.send('new post created')
    })
    .catch((err) => {
      res.sent(err)
    })
}

exports.viewSingle = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id)
    res.render('single-post-screen', { post: post })
  } catch (err) {
    res.render('404')
  }
}
