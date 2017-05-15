// variables
var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function (server) {
  io = socketio.listen(server);
  io.set('log level', 1);

  io.sockets.on('connection', function (socket) {
    guestNumber = assignGuestName(socket, guestNumber, nickNames,
      namesUsed);
    joinRoom(socket, 'Lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on('rooms', function () {
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed);

  });

}

/**
 * Przypisanie nazwy gośca
 * @param  {[type]} socket      [description]
 * @param  {[type]} guestNumber [description]
 * @param  {[type]} nickNames   [description]
 * @param  {[type]} namesUsed   [description]
 * @return {[type]}             [description]
 */
function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  var name = 'Gość' + guestNumber;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  })
  namesUsed.push(name);
  return guestNumber + 1;

}
