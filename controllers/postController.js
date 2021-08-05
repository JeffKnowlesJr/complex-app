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
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('single-post-screen', { post: post })
  } catch (err) {
    res.render('404')
  }
}

exports.viewEditScreen = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id)
    res.render('edit-post', { post: post })
  } catch (err) {
    res.render('404')
  }
}

exports.edit = (req, res) => {
  let post = new Post(req.body, req.visitorId, req.params.id)
  post
    .update()
    .then((status) => {
      // the post was successfully updated in the database
      // or user did have permissions but there were validation errors
      if (status == 'success') {
        // post was updated in db
        req.flash('success', 'Post successfully updated')
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}/edit`)
        })
      } else {
        post.errors.forEach((error) => {
          req.flash('errors', error)
        })
        req.session.save(() => {
          res.redirect(`/post/${req.params.id}/edit`)
        })
      }
    })
    .catch(() => {
      // a post with the requested id doesn't exists
      // or if the current user is not the owner of the post
      req.flash('errors', 'You do not have permission to perform this action.')
      req.session.save(() => {
        res.redirect('/')
      })
    })
}
