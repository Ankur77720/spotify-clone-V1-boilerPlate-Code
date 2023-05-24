var express = require('express')
var router = express.Router()
var userModel = require('./users.js')
const mongoose = require('mongoose')
const Grid = require('gridfs-stream')
const music = require('./music.js')
var localStrategy = require('passport-local')
var passport = require('passport')
var playlists = require('./playList.js')




// **************** user authentication related routes here
function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) return next()
  else res.redirect('/login')
}
function isAlreadyLoggedIn(req, res, next) {
  if (req.isAuthenticated()) res.redirect('/')
  else return next()
}
passport.use(new localStrategy(userModel.authenticate()))
router.post('/register', isAlreadyLoggedIn, async (req, res, next) => {
  var userQueue = shuffleArray(
    await music
      .find({})
      .skip(Math.floor(Math.random() * 310))
      .limit(50),
  )
  var newUser = {
    //user data here
    username: req.body.username,
    queue: userQueue.map((mus) => mus._id),
    playlists: [],
    //user data here
  }
  userModel
    .register(newUser, req.body.password)
    .then((result) => {
      passport.authenticate('local')(req, res, () => {
        //destination after user register
        res.redirect('/')
      })
    })
    .catch((err) => {
      res.render('register', { message: err.message })
    })
})
router.get('/register', isAlreadyLoggedIn, (req, res, next) => {
  res.render('register', { message: '' })
})
router.post(
  '/login',
  isAlreadyLoggedIn,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/failedLogin',
  }),
  (req, res, next) => { },
)
router.get('/failedLogin', (req, res, next) => {
  res.render('login', { message: 'Username or password is not valid !' })
})
router.get('/login', isAlreadyLoggedIn, (req, res, next) => {
  res.render('login', { message: '' })
})
router.get('/logout', (req, res, next) => {
  if (req.isAuthenticated())
    req.logout((err) => {
      if (err) res.send(err)
      else res.redirect('/')
    })
  else {
    res.redirect('/')
  }
})
// **************** user authentication related routes here

/* GET home page. */
router.get('/', (req, res) => {
  res.render('home')
})

module.exports = router
