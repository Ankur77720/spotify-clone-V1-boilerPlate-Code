const mongoose = require('mongoose')
const artistSchema = mongoose.Schema({
  image: String,
  name: String,
})

module.exports = mongoose.model('artist', artistSchema)
