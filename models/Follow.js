const usersCollection = require('../db').db().collection('users')
const followsCollection = require('../db').db().collection('follows')
const User = require('./User')
const ObjectID = require('mongodb').ObjectID

let Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername
  this.authorId = authorId
  this.errors = []
}

Follow.prototype.cleanup = function () {
  if (typeof this.followedUsername != 'string') {
    this.followedUsername = ''
  }
}

Follow.prototype.validate = async function (action) {
  // followedUsername must exist in database
  let followedAccount = await usersCollection.findOne({
    username: this.followedUsername
  })
  if (followedAccount) {
    this.followedId = followedAccount._id
  } else {
    this.errors.push('You cannot follow a user that does not exist')
  }

  let doesFollowAlreadyExit = await followsCollection.findOne({
    followedId: this.followedId,
    authorId: new ObjectID(this.authorId)
  })

  if (action == 'create') {
    if (doesFollowAlreadyExit) {
      {
        this.errors.push('You are already following this user.')
      }
    }
  }
  if (action == 'delete') {
    if (!doesFollowAlreadyExit) {
      {
        this.errors.push('You cannot unfollow someone that you do not follow.')
      }
    }
  }

  // Should not be able to folow yourself
  if (this.followedId == this.authorId) {
    this.errors.push('You cannot follow yourself.')
  }
}

Follow.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanup()
    await this.validate('create')
    if (!this.errors.length) {
      await followsCollection.insertOne({
        followedId: this.followedId,
        authorId: new ObjectID(this.authorId)
      })
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.prototype.delete = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanup()
    await this.validate('delete')
    if (!this.errors.length) {
      await followsCollection.deleteOne({
        followedId: this.followedId,
        authorId: new ObjectID(this.authorId)
      })
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

Follow.isVisitorFollowing = async function (followedId, visitorId) {
  let followDoc = await followsCollection.findOne({
    followedId: followedId,
    authorId: new ObjectID(visitorId)
  })
  if (followDoc) {
    return true
  } else {
    return false
  }
}

Follow.getFollowersById = async function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followsCollection
        .aggregate([
          {
            $match: {
              followedId: id
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'authorId',
              foreignField: '_id',
              as: 'userDoc'
            }
          },
          {
            $project: {
              username: { $arrayElemAt: ['$userDoc.username', 0] },
              email: { $arrayElemAt: ['$userDoc.email', 0] }
            }
          }
        ])
        .toArray()
      followers = followers.map(function (follower) {
        let user = new User(follower, true) // to pull gravatar
        return { username: follower.username, avatar: user.avatar }
      })
      resolve(followers)
    } catch {
      reject()
    }
  })
}

Follow.getFollowingById = async function (id) {
  return new Promise(async (resolve, reject) => {
    try {
      let following = await followsCollection
        .aggregate([
          {
            $match: {
              authorId: id
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'followedId',
              foreignField: '_id',
              as: 'userDoc'
            }
          },
          {
            $project: {
              username: { $arrayElemAt: ['$userDoc.username', 0] },
              email: { $arrayElemAt: ['$userDoc.email', 0] }
            }
          }
        ])
        .toArray()
      following = following.map(function (following) {
        let user = new User(following, true) // to pull gravatar
        return { username: following.username, avatar: user.avatar }
      })
      resolve(following)
    } catch {
      reject()
    }
  })
}

module.exports = Follow
