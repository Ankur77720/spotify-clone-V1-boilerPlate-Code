var express = require('express')
var router = express.Router()
var userModel = require('./users.js')
var artistModel = require('./artist.js')
const mongoose = require('mongoose')
var { upload, conn, db } = require('./multer.js')
const Grid = require('gridfs-stream')
const music = require('./music.js')
var localStrategy = require('passport-local')
var passport = require('passport')
var playListModel = require('./playList.js')
var GoogleStrategy = require('passport-google-oidc')
require('dotenv').config()

// **************** user authentication related routes here
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
router.get('/', isloggedIn, async function (req, res, next) {
  var topMusic
  topMusic = await music
    .find({})
    .skip(Math.floor(Math.random() * 360))
    .limit(1)
  topMusic = topMusic[0]
  var songs = (
    await music
      .find({})
      .skip(Math.floor(Math.random() * 360))
      .limit(6)
  ).reverse()
  var playLists = await playListModel.find({}).limit(6)
  var dailyRemixes = await music
    .find({})
    .skip(Math.floor(Math.random() * 270))
    .limit(100)
  dailyRemixes = shuffleArray(dailyRemixes)
  var temp = []
  for (var i = 0; i < 10; i++) {
    temp.push(dailyRemixes[i])
  }
  dailyRemixes = temp
  var currentQueue = await userModel
    .findOne({ username: req.user.username })
    .populate('queue')
  currentQueue = currentQueue.queue
  var currentUser = await userModel
    .findOne({ username: req.user.username })
    .populate('playlists')
  var artists = await artistModel.find({})

  artists = shuffleArray(artists)
  var lastPlaying
  if (req.user.lastPlaying) lastPlaying = req.user.lastPlaying
  else lastPlaying = topMusic
  res.render('index', {
    username: req.user.username,
    topMusic,
    songs,
    artists,
    playLists,
    dailyRemixes,
    lastPlaying,
    currentQueue: currentQueue,
    user: currentUser,
  })
})
// ************* songs by artist ********************* //

// **************** Get music here ***************************
router.get('/file/:filename', isloggedIn, async function (req, res) {
  try {
    let file = await gfs.files.findOne({
      filename: req.params.filename,
    })
    let musicFile = await music.findOne({
      name: req.params.filename,
    })
    // Ensure there is a range given for the video
    const range = req.headers.range
    if (!range) {
      res.status(400).send('Requires Range header')
    }

    // get file size
    const fileSize = file.length + 1

    const parts = range.split('-')
    const start = parseInt(parts[0].replace('bytes=', ''))
    const end = parts[1] ? parseInt(parts[1]) : fileSize - 1
    const CHUNK_SIZE = end - start + 1 // 1MB
    if (start > fileSize) start = fileSize - 1
    // Create headers
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': CHUNK_SIZE,
      'Content-Type': getContentType(req.params.filename),
    }

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers)

    // create video read stream for this particular chunk
    const readstream = gridFSBucket.openDownloadStreamByName(file.filename, {
      start,
      end,
    })

    // Stream the video chunk to the client

    await userModel.findOneAndUpdate(
      {
        username: req.user.username,
      },
      {
        lastPlaying: musicFile,
      },
    )
    readstream.pipe(res)
  } catch (err) {}
})
// **************** Get music here ***************************

// **************** Get poster here **************************
router.get('/image/:filename', isloggedIn, async function (req, res) {
  let file = await gfsImage.files.findOne({ filename: req.params.filename })
  if (!file || file.length == 0) {
    res.send({ err: 'file not exist' })
  } else {
    const readstream = gridFSBucketImage.openDownloadStreamByName(file.filename)
    readstream.pipe(res)
  }
})
// **************** Get poster here **************************

// ******************* like song here *********************//
router.post('/like/:filename', isloggedIn, async (req, res, next) => {
  var currentMusic = await music.findOne({
    name: req.params.filename,
  })
  var currentUser = await userModel.findOne({
    username: req.user.username,
  })
  var index = currentMusic.liked.indexOf(currentUser._id)
  if (index == -1) {
    currentMusic.liked.push(currentUser._id)
    currentUser.liked.push(currentMusic._id)
    await currentMusic.save()
    await currentUser.save()
    res.status(200).json({ status: 'liked' })
  } else {
    await music.findOneAndUpdate(
      { name: currentMusic.name },
      { $pull: { liked: currentUser._id } },
    )
    await userModel.findOneAndUpdate(
      { username: currentUser.username },
      { $pull: { liked: currentMusic._id } },
    )
    res.status(200).json({ status: 'unLiked' })
  }
})
// ******************* like song here *********************//

module.exports = router
