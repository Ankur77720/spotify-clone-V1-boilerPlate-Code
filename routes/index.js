var express = require('express')
var router = express.Router()
var userModel = require('./users.js')
const mongoose = require('mongoose')
const Grid = require('gridfs-stream')
const music = require('./music.js')
var localStrategy = require('passport-local')
var passport = require('passport')
var playListModel = require('./playList.js')

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
let gridFSBucket
let gridFSBucketImage
let gfs
let gfsImage
let gfsArtist
function trimEmail(email) {
  const username = email.slice(0, email.indexOf('@'))

  return username
}
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo)
  gfsImage = Grid(conn.db, mongoose.mongo)
  gfsArtist = Grid(conn.db, mongoose.mongo)
  gfs.collection('music')
  gfsImage.collection('posters')
  gfsArtist.collection('artist')
  gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'music',
  })
  gridFSBucketImage = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'posters',
  })
  gridFSBucketArtist = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'artist',
  })
})
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

  var lastPlaying
  if (req.user.lastPlaying) lastPlaying = req.user.lastPlaying
  else lastPlaying = topMusic
  res.render('index', {
    username: req.user.username,
    topMusic,
    songs,
    dailyRemixes,
    lastPlaying,
    currentQueue: currentQueue,
    user: currentUser,
  })
})
// ************* songs by artist ********************* //

//  ******************* Random songs ******************* //
router.post('/randomSongs', isloggedIn, async (req, res, next) => {
  var songs = shuffleArray(
    await music
      .find({})
      .skip(Math.floor(Math.random() * 340))
      .limit(25),
  )
  res.status(200).json({ status: 'success', musics: songs })
})
router.post('/liked', isloggedIn, async (req, res, next) => {
  var songs = await userModel
    .findOne({ username: req.user.username })
    .populate('liked')
  songs = songs.liked
  res.status(200).json({ status: 'success', musics: songs })
})
//  ******************* Random songs ******************* //

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
  } catch (err) {
    console.log(err)
  }
})
// **************** Get music here ***************************

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
