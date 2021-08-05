const postsCollection = require('../db').db().collection('posts')
const ObjectID = require('mongodb').ObjectID
const User = require('../models/User')

// Post Constructor Function
// Accepts a Post Object and the Author's User ID
let Post = function (formData, userid, requestedPostId) {
  ;(this.data = formData),
    (this.errors = []),
    (this.userid = userid),
    (this.requestedPostId = requestedPostId)
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

Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(this.requestedPostId, this.userid)
      if (post.isVisitorOwner) {
        // actually update the db
        let status = await this.updatePost()
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject()
    }
  })
}

Post.prototype.updatePost = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate(
        {
          _id: new ObjectID(this.requestedPostId)
        },
        { $set: { title: this.data.title, body: this.data.body } }
      )
      resolve('success')
    } else {
      resolve('failure')
    }
  })
}

// This is a mongoose strategy
Post.reusablePostQuery = function (uniqueOperations, visitorId) {
  return new Promise(async function (resolve, reject) {
    let aggOpperations = uniqueOperations.concat([
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
          authorId: '$author',
          author: { $arrayElemAt: ['$authorDocument', 0] }
        }
      }
    ])

    // Adds author property to the lookup
    let posts = await postsCollection.aggregate(aggOpperations).toArray()

    // clean up author property in each post object
    posts = posts.map((post) => {
      post.isVisitorOwner = post.authorId.equals(visitorId)

      post.author = {
        username: post.author.username,
        avatar: new User(post.author, true).avatar
      }
      return post
    })

    resolve(posts)
  })
}

Post.findSingleById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    if (typeof id != 'string' || !ObjectID.isValid(id)) {
      reject()
      return
    }

    let posts = await Post.reusablePostQuery(
      [{ $match: { _id: new ObjectID(id) } }],
      visitorId
    )

    if (posts.length) {
      resolve(posts[0])
    } else {
      reject()
    }
  })
}

Post.findByAuthorId = function (authorId) {
  return Post.reusablePostQuery([
    { $match: { author: authorId } },
    { $sort: { createdAt: -1 } }
  ])
}

module.exports = Post
