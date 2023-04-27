const mongoose = require('mongoose')
mongoose
  .connect('mongodb://0.0.0.0/spotify')
  .then((result) => {
    console.log('connected to db  ')
  })
  .catch((err) => {
    console.log(err)
  })
var passportLocalMongoose = require('passport-local-mongoose')
var userSchema = mongoose.Schema({
  username: String,
  password: String,
  liked: [{ type: mongoose.Types.ObjectId, ref: 'music' }],
  queue: [{ type: mongoose.Types.ObjectId, ref: 'music' }],
  playlists: [{ type: mongoose.Types.ObjectId, ref: 'playList' }],
  lastPlaying: {},
  currentDevices: [{ type: String }],
})
userSchema.plugin(passportLocalMongoose)
module.exports = mongoose.model('user', userSchema)
