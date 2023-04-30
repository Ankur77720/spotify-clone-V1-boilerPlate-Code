const mongoose = require('mongoose')
const playListSchema = mongoose.Schema({
  poster: String,
  title: String,
  musics: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'music',
    },
  ],
})

module.exports = mongoose.model('playList', playListSchema)
