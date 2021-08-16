const Post = require('../models/Post')
const sendgrid = require('@sendgrid/mail')
sendgrid.setApiKey(process.env.SENDGRID_APIKEY)

exports.viewCreateScreen = (req, res) => {
  res.render('create-post')
}

exports.create = (req, res) => {
  let post = new Post(req.body, req.session.user.id)
  post
    .create()
    .then(() => {
      sendgrid
        .send({
          to: 'jeffknowlesjr@gmail.com',
          from: 'jeffknowlesjr@gmail.com',
          subject: 'New Post on PostApp: ' + req.body.title,
          text: req.body.body,
          html: req.body.body
        })
        .then(() => {
          console.log('Message sent')
        })
        .catch((err) => {
          console.log(err.response.body)
        })
      req.flash('success', 'Post created')
      req.session.save(() => {
        res.redirect(`/post/${post.data._id}`)
      })
    })
    .catch((err) => {
      err.forEach((error) => {
        req.flash('errors', error)
      })
      req.session.save(() => {
        req.redirect('/create-post')
      })
    })
}

exports.apiCreate = (req, res) => {
  let post = new Post(req.body, req.apiUser._id)
  post
    .create()
    .then(() => {
      res.json('Congrats.')
    })
    .catch((err) => {
      res.json(err)
    })
}

exports.viewSingle = async (req, res) => {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('single-post-screen', { post: post, title: post.title })
  } catch (err) {
    res.render('404')
  }
}

exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) {
      res.render('edit-post', { post: post })
    } else {
      req.flash('errors', 'You do not have permission to perform that action.')
      req.session.save(() => res.redirect('/'))
    }
  } catch {
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

exports.delete = (req, res) => {
  Post.delete(req.params.id, req.visitorId)
    .then(() => {
      req.flash('success', 'Post successfully deleted')
      req.session.save(() => {
        res.redirect(`/profile/${req.session.user.username}`)
      })
    })
    .catch(() => {
      req.flash('errors', 'You do not have permission to perform this action.')
      req.session.save(() => {
        res.redirect('/')
      })
    })
}

exports.apiDelete = (req, res) => {
  Post.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json(`Congrats, you've successfully deleted post ${req.params.id}`)
    })
    .catch((err) => {
      res.json(err)
    })
}

exports.search = (req, res) => {
  Post.search(req.body.searchTerm)
    .then((posts) => {
      res.json(posts)
    })
    .catch(() => {
      res.json([])
    })
}
