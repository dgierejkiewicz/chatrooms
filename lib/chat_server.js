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

/**
 * Dołączanie do pokoju
 * @param  {[type]} socket [description]
 * @param  {[type]} room   [description]
 * @return {[type]}        [description]
 */
function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', {room: room});
  socket.broadcast.to(room).emit('message', {text: nickNames[socket.id] + ' dołączył do pokoju ' + room + '.'});
  var usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length > 1) {
    var usersInRoomSummary = 'Lista użytkowników w pokoju ' + room + ': ';
    for (var index in usersInRoom) {
      var userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomSummary += '. ';
        }
        usersInRoomSummary += nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', {text: usersInRoomSummary});
  }
}


/**
 * Zmiana nazwy użytkownika
 * @param  {[type]} socket    [description]
 * @param  {[type]} nickNames [description]
 * @param  {[type]} namesUsed [description]
 * @return {[type]}           [description]
 */
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function (name) {
    if (name.indexOf('Gość') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Nazwa użytkownika nie może zaczynać się od słowa "Gość".'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) {
        var prevoiusName = nickNames[socket.id];
        var prevoiusNameIndex = namesUsed.indexOf(prevoiusName);
        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[prevoiusNameIndex];
        socket.emit('nameResult', {
          success: true,
          name: name
        });
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: prevoiusName + ' zmienił nazwę na: ' + name + '.'
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'Ta nazwa jest używana przez innego użytkownika.';
        });
      }
    }
  })
}
