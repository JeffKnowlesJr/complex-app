const postsCollection = require('../db').db().collection('posts')
const ObjectID = require('mongodb').ObjectID
const User = require('../models/User')

let Post = function (formData, userid) {
  ;(this.data = formData), (this.errors = []), (this.userid = userid)
}

Post.prototype.cleanUp = function () {
  let { title, body } = this.data
  if (typeof title != 'string') {
    title = ''
  }
  if (typeof body != 'string') {
    body = ''
  }

  // Get rid of any bogus properties

  this.data = {
    title: title.trim(),
    body: body.trim(),
    createdAt: new Date(),
    author: ObjectID(this.userid)
  }
}

Post.prototype.validate = function () {
  if (this.data.title == '') {
    this.errors.push('You must enter a title')
  }
  if (this.data.body == '') {
    this.errors.push('You must enter post content.')
  }
}

Post.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      postsCollection
        .insertOne(this.data)
        .then(() => {
          resolve()
        })
        .catch(() => {
          this.errors.push('Please try again later.')
          reject(this.errors)
        })
    } else {
      reject(this.errors)
    }
  })
}

// This is a mongoose strategy

Post.findSingleById = function (id) {
  return new Promise(async function (resolve, reject) {
    if (typeof id != 'string' || !ObjectID.isValid(id)) {
      reject()
      return
    }

    // Adds author property to the lookup
    let posts = await postsCollection
      .aggregate([
        { $match: { _id: new ObjectID(id) } },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorDocument'
          }
        },
        {
          $project: {
            title: 1,
            body: 1,
            createdAt: 1,
            author: { $arrayElemAt: ['$authorDocument', 0] }
          }
        }
      ])
      .toArray()

    // clean up author property in each post object
    posts = posts.map((post) => {
      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })

    if (posts.length) {
      console.log(posts[0])
      resolve(posts[0])
    } else {
      reject()
    }
  })
}

module.exports = Post
