const postsCollection = require('../db').db().collection('posts')
const followsCollection = require('../db').db().collection('follows')
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

// Some MongoDB things!
// If you'd rather create indexes on your database collections without going into the Atlas website you can use the code below:
// postsCollection.createIndex({title: "text", body: "text"})
// For example, you could include this code towards the top of your Post.js model file.  MongoDB will only create the index if one doesn't already exist; so leaving this in your code wouldn't be a huge problem; although just to be clean and safe you could comment it out once you know the index has been created.
// This way if you ever move to a new database you can just uncomment the line and the index will be created automatically.
// If you'd like to see a list of all the indexes you currently have on a collection you can use this code:
// async function checkIndexes() {
//   const indexes = await postsCollection.indexes()
//   console.log(indexes)
// }
// checkIndexes()
// You can delete an index by taking note of its name from the above list, and then you'd pass the name of the index as an argument like this:
// postsCollection.dropIndex("namehere")

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
    title: sanitizeHTML(title.trim(), {
      allowedTags: [],
      allowedAttributes: {}
    }),
    body: sanitizeHTML(body.trim(), { allowedTags: [], allowedAttributes: {} }),
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
Post.reusablePostQuery = function (
  uniqueOperations,
  visitorId,
  finalOperations = []
) {
  return new Promise(async function (resolve, reject) {
    let aggOpperations = uniqueOperations
      .concat([
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
      .concat(finalOperations)

    // Adds author property to the lookup
    let posts = await postsCollection.aggregate(aggOpperations).toArray()

    // clean up author property in each post object
    posts = posts.map((post) => {
      post.isVisitorOwner = post.authorId.equals(visitorId)
      post.authorId = undefined

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

Post.delete = function (id, visitorId) {
  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(id, visitorId)
      if (post.isVisitorOwner) {
        await postsCollection.deleteOne({ _id: new ObjectID(id) })
        resolve()
      } else {
        reject()
      }
    } catch (err) {
      reject(err)
    }
  })
}

Post.search = function (searchTerm) {
  return new Promise(async (resolve, reject) => {
    if (typeof searchTerm == 'string') {
      let posts = await Post.reusablePostQuery(
        [{ $match: { $text: { $search: searchTerm } } }],
        undefined,
        [{ $sort: { score: { $meta: 'textScore' } } }]
      )
      resolve(posts)
    } else {
      reject()
    }
  })
}

Post.countPostsByAuthor = function (id) {
  return new Promise(async (resolve, reject) => {
    let postCount = await postsCollection.countDocuments({
      author: id
    })
    resolve(postCount)
  })
}

Post.getFeed = async function (id) {
  // create an array of the user ids that the current user follows
  let followedUsers = await followsCollection
    .find({ authorId: new ObjectID(id) })
    .toArray()
  followedUsers = followedUsers.map(function (followDoc) {
    return followDoc.followedId
  })

  // look for posts where the author is in the above array of followed users

  return Post.reusablePostQuery([
    { $match: { author: { $in: followedUsers } } },
    { $sort: { createdAt: -1 } }
  ])
}

module.exports = Post
