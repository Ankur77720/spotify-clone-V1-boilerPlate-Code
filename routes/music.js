const mongoose = require('mongoose')

const musicSchema = mongoose.Schema({
  name: String,
  poster: String,
  artist: String,
  album: String,
  title: String,
  liked: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'user',
    },
  ],  
})

module.exports = mongoose.model('music', musicSchema)
