const bcrypt = require('bcryptjs')
const usersCollection = require('../db').db().collection('users')
const validator = require('validator')
const md5 = require('md5')

// Constructor Function: This function required a special consideration
// to allow the use of the this keyword to point to the new instance of
// the user being created. An arrow function will not work as expected.
let User = function (formData, getAvatar) {
  this.data = formData
  this.errors = []
  if (getAvatar == undefined) {
    getAvatar = false
  }
  if (getAvatar) {
    this.getAvatar()
  }
}

User.prototype.cleanUp = function () {
  let { username, email, password } = this.data
  if (typeof username != 'string') {
    username = ''
  }
  if (typeof email != 'string') {
    email = ''
  }
  if (typeof password != 'string') {
    password = ''
  }

  // Get rid of any bogus properties

  this.data = {
    username: username.trim().toLowerCase(),
    email: email.trim().toLowerCase(),
    password: password
  }
}

User.prototype.validate = function () {
  return new Promise(async (resolve, reject) => {
    let { username, email, password } = this.data
    let err = this.errors

    // if username, email, password field is blank
    if (username == '') {
      err.push('Username is required')
    }
    if (!validator.isEmail(email)) {
      err.push('Valid email is required')
    }
    if (password == '') {
      err.push('Valid password is required')
    }
    // if password is less than 8 characters
    if (password.length < 8 && password.length > 0) {
      err.push('Password must be at least 8 characters')
    }
    // if password is more than 50 characters
    if (password.length > 50) {
      err.push('Password must be at most 50 characters')
    }
    // if username is less than 6 characters
    if (username.length < 4 && username.length > 0) {
      err.push('Username must be at least 4 characters')
    }
    // if username is more than 16 characters
    if (username.length > 16) {
      err.push('Username must be at most 16 characters')
    }
    // if username is not alphanumeric
    if (username != '' && !validator.isAlphanumeric(username)) {
      err.push('Username can only contain letters and numbers')
    }
    // if username is valid check if taken
    if (
      username.length > 4 &&
      username.length < 16 &&
      validator.isAlphanumeric(username)
    ) {
      let usernameExists = await usersCollection.findOne({ username: username })
      if (usernameExists) {
        err.push('This username already exists')
      }
    }
    // if email is valid check if taken
    if (validator.isEmail(email)) {
      let emailExists = await usersCollection.findOne({ email: email })
      if (emailExists) {
        err.push('This email is already being used')
      }
    }
    resolve()
  })
}

User.prototype.login = function () {
  // Call Back Approach -> Ommitted for Promise implementation
  return new Promise((resolve, reject) => {
    this.cleanUp()
    usersCollection
      .findOne({ username: this.data.username })
      .then((user) => {
        if (user && bcrypt.compareSync(this.data.password, user.password)) {
          this.data = user
          this.getAvatar()
          resolve('User logged in')
        } else {
          reject('Invalid username or password')
        }
      })
      .catch(() => {
        reject('Please try again later')
      })
  })
}

User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    // Step #1: Validate user data
    this.cleanUp()
    await this.validate()

    // Step #2: Only if there are no validation errors
    // then save the user data into a database
    if (!this.errors.length) {
      // hash user password
      let salt = bcrypt.genSaltSync(10)
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await usersCollection.insertOne(this.data)
      this.getAvatar()
      resolve()
    } else {
      reject(this.errors)
    }
  })
}

User.prototype.getAvatar = function () {
  this.avatar = `https://s.gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findByUserName = (username) => {
  return new Promise((resolve, reject) => {
    if (typeof username != 'string') {
      reject()
      return
    }
    usersCollection
      .findOne({ username: username })
      .then((userDocument) => {
        if (userDocument) {
          userDocument = new User(userDocument, true)
          userDocument = {
            _id: userDocument.data._id,
            username: userDocument.data.username,
            avatar: userDocument.avatar
          }
          resolve(userDocument)
        } else {
          reject()
        }
      })
      .catch(() => {
        reject()
      })
  })
}

module.exports = User
