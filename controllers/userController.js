const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')

// This function is going to run on a profile route
exports.sharedProfileData = async (req, res, next) => {
  let isVisitorsProfile = false

  // We're setting a default is following propery to false
  let isFollowing = false

  // If the current visitor is logged in
  if (req.session.user) {
    isVisitorsProfile = req.profileUser._id.equals(req.session.user.id)

    // Is this visitor following the current profile?
    isFollowing = await Follow.isVisitorFollowing(
      req.profileUser._id,
      req.visitorId
    )
  }

  // We're storing the result on our request object so that
  // we can use it within our next function on the route
  req.isFollowing = isFollowing
  req.isVisitorsProfile = isVisitorsProfile

  // Retreive post, follower, and post counts
  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id)
  let [postCount, followerCount, followingCount] = await Promise.all([
    postCountPromise,
    followerCountPromise,
    followingCountPromise
  ])
  req.postCount = postCount
  req.followerCount = followerCount
  req.followingCount = followingCount

  next()
}

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
  //  ask out post model for posts by a certain user
  Post.findByAuthorId(req.profileUser._id)
    .then(function (posts) {
      res.render('profile', {
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        tab: 'posts',
        counts: {
          postCount: req.postCount,
          followerCount: req.followerCount,
          followingCount: req.followingCount
        }
      })
    })
    .catch(function () {
      res.render('404')
    })
}

exports.profileFollowersScreen = async (req, res) => {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id)

    res.render('profile-followers', {
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      tab: 'followers',
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount
      }
    })
  } catch (err) {
    res.render('404')
  }
}

exports.profileFollowingScreen = async (req, res) => {
  try {
    let following = await Follow.getFollowingById(req.profileUser._id)

    res.render('profile-following', {
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      tab: 'following',
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount
      }
    })
  } catch (err) {
    res.render('404')
  }
}
