const io = require('socket.io')()
const userModel = require('./routes/users.js')
const socketapi = {
  io: io,
}

var connectedSockets = {}

// Add your socket.io logic here!
io.on('connection', function (socket) {
  console.log('A user connected')
})
// end of socket.io logic

module.exports = socketapi
