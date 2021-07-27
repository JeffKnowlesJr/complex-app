exports.login = () => {}

exports.logout = () => {}

exports.register = (req, res) => {
  res.send('thanks for trying to register')
}

exports.home = (req, res) => {
  res.render('home-guest')
}
