const io = require('socket.io')()
const userModel = require('./routes/users.js')
const socketapi = {
  io: io,
}

var connectedSockets = {}

// Add your socket.io logic here!
io.on('connection', function (socket) {
  console.log('A user connected')
  socket.on('currentlyPlaying', async (msg) => {
    var currentUser = await userModel.findOne({ _id: msg.userId })
    console.log(currentUser)
    currentUser.currentDevices.forEach((socketId) => {
      if (socket.id != socketId)
        socket.to(socketId).emit('currentlyPlaying', msg.music)
    })
  })
  socket.on('pause', async (msg) => {
    var currentUser = await userModel.findOne({ _id: msg.userId })
    currentUser.currentDevices.forEach((socketId) => {
      if (socket.id != socketId) socket.to(socketId).emit('pause', msg)
    })
  })
  socket.on('play', async (msg) => {
    var currentUser = await userModel.findOne({ _id: msg.userId })
    currentUser.currentDevices.forEach((socketId) => {
      if (socket.id != socketId) socket.to(socketId).emit('play', msg)
    })
  })
  socket.on('changeCurrentTime', async (msg) => {
    var currentUser = await userModel.findOne({ _id: msg.userId })
    currentUser.currentDevices.forEach((socketId) => {
      if (socket.id != socketId)
        socket.to(socketId).emit('changeCurrentTime', msg)
    })
  })

  socket.on('connected', async (msg) => {
    connectedSockets[socket.id] = { userId: msg.userId, socket: socket }
    await userModel.findOneAndUpdate(
      { _id: msg.userId },
      { $push: { currentDevices: socket.id } },
    )
  })
  socket.on('disconnect', async () => {
    try {
      await userModel.findOneAndUpdate(
        { _id: connectedSockets[socket.id]['userId'] },
        { $pull: { currentDevices: socket.id } },
      )
      delete connectedSockets[socket.id]
    } catch (err) {}
  })
})
// end of socket.io logic

module.exports = socketapi
