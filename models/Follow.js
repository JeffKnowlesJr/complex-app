const usersCollection = require('../db').db().collection('users')
const followsCollection = require('../db').db().collection('follows')
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

module.exports = Follow
