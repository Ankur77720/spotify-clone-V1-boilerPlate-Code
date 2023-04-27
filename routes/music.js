const mongoose = require('mongoose')
mongoose.connect('mongodb://0.0.0.0/spotify')

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
