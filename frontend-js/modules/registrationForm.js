import axios from 'axios'

export default class RegistrationForm {
  // constructor
  constructor() {
    this.form = document.querySelector('#registration-form')
    this.allFields = document.querySelectorAll(
      '#registration-form .form-control'
    )
    this.insertValidationElements()
    this.username = document.querySelector('#username-register')
    this.username.previousValue = ''
    this.email = document.querySelector('#email-register')
    this.email.previousValue = ''
    this.password = document.querySelector('#password-register')
    this.password.previousValue = ''
    this.username.isUnique = false
    this.email.isUnique = false
    this.events()
  }
  // events
  events() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault()
      this.formSubmitHandler()
    })

    this.username.addEventListener('keyup', () => {
      this.isDifferent(this.username, this.usernameHandler)
    })
    this.email.addEventListener('keyup', () => {
      this.isDifferent(this.email, this.emailHandler)
    })
    this.password.addEventListener('keyup', () => {
      this.isDifferent(this.password, this.passwordHandler)
    })
    this.username.addEventListener('blur', () => {
      this.isDifferent(this.username, this.usernameHandler)
    })
    this.email.addEventListener('blur', () => {
      this.isDifferent(this.email, this.emailHandler)
    })
    this.password.addEventListener('blur', () => {
      this.isDifferent(this.password, this.passwordHandler)
    })
  }

  // methods
  insertValidationElements() {
    this.allFields.forEach(function (elem) {
      elem.insertAdjacentHTML(
        'afterend',
        '<div class="alert alert-danger small liveValidateMessage"></div>'
      )
    })
  }

  isDifferent(elem, handler) {
    if (elem.previousValue != elem.value) {
      handler.call(this)
    }
    elem.previousValue = elem.value
  }

  usernameHandler() {
    this.username.errors = false
    this.usernameImmediately()
    clearTimeout(this.username.timer)
    this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800)
  }

  passwordHandler() {
    this.password.errors = false
    this.passwordImmediately()
    clearTimeout(this.password.timer)
    this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800)
  }

  passwordImmediately() {
    if (this.password.value.length > 50) {
      this.showValidationError(
        this.password,
        'Password cannot be longer than 50 characters'
      )
    }
    if (!this.password.errors) {
      this.hideValidationError(this.password)
    }
  }

  passwordAfterDelay() {
    if (this.password.value.length < 12) {
      this.showValidationError(
        this.password,
        'Password must be at least 12 characters long'
      )
    }
  }

  emailHandler() {
    this.email.errors = false
    clearTimeout(this.email.timer)
    this.email.timer = setTimeout(() => this.emailAfterDelay(), 800)
  }

  formSubmitHandler() {
    this.usernameImmediately()
    this.usernameAfterDelay()
    this.emailAfterDelay()
    this.passwordImmediately()
    this.passwordAfterDelay()
    if (
      this.username.isUnique &&
      !this.username.errors &&
      this.email.isUnique &&
      !this.email.errors &&
      !this.password.errors
    ) {
      this.form.submit()
    }
  }

  emailAfterDelay() {
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(this.email, 'Must be a valid email address')
    }

    if (!this.email.errors) {
      axios
        .post('/doesEmailExist', { email: this.email.value })
        .then((response) => {
          if (response.data) {
            this.email.isUnique = false
            this.showValidationError(
              this.email,
              'This email address is already in use'
            )
          } else {
            this.email.isUnique = true
            this.hideValidationError(this.email)
          }
        })
        .catch(() => {
          console.log('Please try again later')
        })
    }
  }

  usernameImmediately() {
    if (
      this.username.value != '' &&
      !/^([a-zA-Z0-9]+)$/.test(this.username.value)
    ) {
      this.showValidationError(
        this.username,
        'Username can only contain letters and numbers'
      )
    }

    if (this.username.value.length > 16) {
      this.showValidationError(
        this.username,
        'Username cannot exceed 16 characters'
      )
    }

    if (!this.username.errors) {
      this.hideValidationError(this.username)
    }
  }

  hideValidationError(elem) {
    elem.nextElementSibling.classList.remove('liveValidateMessage--visible')
  }

  showValidationError(elem, message) {
    elem.nextElementSibling.innerHTML = message
    elem.nextElementSibling.classList.add('liveValidateMessage--visible')
    elem.errors = true
  }

  usernameAfterDelay() {
    if (this.username.value.length < 4) {
      this.showValidationError(
        this.username,
        'Username must be at least 4 characters long'
      )
    }

    if (!this.username.errors) {
      axios
        .post('/doesUsernameExist', { username: this.username.value })
        .then((response) => {
          if (response.data) {
            this.showValidationError(
              this.username,
              'This username is already taken'
            )
            this.username.isUnique = false
          } else {
            this.username.isUnique = true
          }
        })
        .catch(() => {
          console.log('Please try again later')
        })
    }
  }
}
