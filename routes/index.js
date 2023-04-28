var express = require('express')
var router = express.Router()
var userModel = require('./users.js')
const mongoose = require('mongoose')
const Grid = require('gridfs-stream')
const music = require('./music.js')
var localStrategy = require('passport-local')
var passport = require('passport')
var playlists = require('./playList.js')

mongoose
  .connect('mongodb://0.0.0.0/spotify')
  .then((result) => {
    console.log('connected to database')
  })
  .catch((err) => {
    console.log('err')
  })
var conn = mongoose.connection
function isAlreadyLoggedIn(req, res, next) {
  if (req.isAuthenticated()) res.redirect('/')
  else return next()
}
function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) return next()
  else res.redirect('/login')
}
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// **************** user authentication related routes here
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
  (req, res, next) => {},
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
// router.get('/', isloggedIn, async function (req, res, next) {
//   var topMusic
//   topMusic = await music
//     .find({})
//     .skip(Math.floor(Math.random() * 360))
//     .limit(1)
//   topMusic = topMusic[0]
//   var songs = (
//     await music
//       .find({})
//       .skip(Math.floor(Math.random() * 360))
//       .limit(6)
//   ).reverse()
//   var dailyRemixes = await music
//     .find({})
//     .skip(Math.floor(Math.random() * 270))
//     .limit(100)
//   dailyRemixes = shuffleArray(dailyRemixes)
//   var temp = []
//   for (var i = 0; i < 10; i++) {
//     temp.push(dailyRemixes[i])
//   }
//   dailyRemixes = temp
//   var currentQueue = await userModel
//     .findOne({ username: req.user.username })
//     .populate('queue')
//   currentQueue = currentQueue.queue
//   var currentUser = await userModel
//     .findOne({ username: req.user.username })
//     .populate('playlists')

//   var lastPlaying
//   if (req.user.lastPlaying) lastPlaying = req.user.lastPlaying
//   else lastPlaying = topMusic
//   res.render('index', {
//     username: req.user.username,
//     topMusic,
//     songs,
//     dailyRemixes,
//     lastPlaying,
//     currentQueue: currentQueue,
//     user: currentUser,
//   })
// })

module.exports = router
