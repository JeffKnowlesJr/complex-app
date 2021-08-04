const User = require('../models/User')

exports.auth = function (req, res, next) {
  if (req.session.user) {
    next()
  } else {
    req.flash('errors', 'You must be logged in to perform that action')
    req.session.save(() => {
      res.redirect('/')
    })
  }
}

exports.login = (req, res) => {
  let user = new User(req.body)
  // login returns a promise
  user
    .login()
    .then(() => {
      // Req reuires async redirect
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        id: user.data._id
      }
      req.session.save(() => {
        res.redirect('/')
      })
    })
    .catch((err) => {
      req.flash('errors', err)
      // req.session.flash.errors = [err]
      req.session.save(() => {
        res.redirect('/')
      })
    })
}

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/')
  })
}

exports.register = (req, res) => {
  let user = new User(req.body)
  user
    .register()
    .then(() => {
      req.session.user = {
        avatar: user.avatar,
        username: user.data.username,
        id: user.data._id
      }
      req.session.save(() => {
        res.redirect('/')
      })
    })
    .catch((regErrors) => {
      regErrors.forEach((err) => {
        req.flash('regErrors', err)
      })
      req.session.save(() => {
        res.redirect('/')
      })
    })
}

exports.home = (req, res) => {
  if (req.session.user) {
    // console.log(req.session.user)
    res.render('home-dashboard')
  } else {
    // using flash package to access and delete errors
    res.render('home-guest', {
      errors: req.flash('errors'),
      regErrors: req.flash('regErrors')
    })
  }
}

exports.ifUserExists = (req, res, next) => {
  User.findByUserName(req.params.username)
    .then((userDocument) => {
      req.profileUser = userDocument
      next()
    })
    .catch(() => {
      res.render('404')
    })
}

exports.profilePostsScreen = (req, res) => {
  res.render('profile', {
    profileUsername: req.profileUser.username,
    profileAvatar: req.profileUser.avatar
  })
}
