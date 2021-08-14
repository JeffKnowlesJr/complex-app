export default class RegistrationForm {
  // constructor
  constructor() {
    this.allFields = document.querySelectorAll(
      '#registration-form .form-control'
    )
    this.insertValidationElements()
    this.username = document.querySelector('#username-register')
    this.username.previousValue = ''
    this.events()
  }
  // events
  events() {
    this.username.addEventListener('keyup', () => {
      this.isDifferent(this.username, this.usernameHandler)
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
  }
}
