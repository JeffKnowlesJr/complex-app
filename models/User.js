const usersCollection = require('../db').collection('users')
const validator = require('validator')

// Constructor Function: This function required a special consideration
// to allow the use of the this keyword to point to the new instance of
// the user being created. An arrow function will not work as expected.
let User = function (formData) {
  this.data = formData
  this.errors = []
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
  // if password is more than 64 characters
  if (password.length > 64) {
    err.push('Password must be at most 64 characters')
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
}

User.prototype.login = function (callBack) {
  this.cleanUp()
  usersCollection.findOne(
    { username: this.data.username },
    (err, attemptedUser) => {
      if (attemptedUser && attemptedUser.password == this.data.password) {
        callBack('User logged in')
      } else {
        callBack('User failed to login')
      }
    }
  )
}

User.prototype.register = function () {
  // Step #1: Validate user data
  this.cleanUp()
  this.validate()

  // Step #2: Only if there are no validation errors
  // then save the user data into a database
  if (!this.errors.length) {
    usersCollection.insertOne(this.data)
  }
}

module.exports = User
