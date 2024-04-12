const rooms = require('../models/Room.js');
const user = require('../models/User.js');

exports.initGame = async function(io, socket, cb) {
  socket.on("disconnect", onDisconnect)
  
  async function onDisconnect() {
    const room = await rooms.findOne({ playerIds: socket.request.user.id })
    if (!room) return;
    socket.to(room.id).emit('playerDisconnected', 'game ended')
    io.socketsLeave(room.id)
    await rooms.deleteOne({ id: room.id })
  }
}