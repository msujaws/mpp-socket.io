/**
 * Module dependencies.
 */

var express = require('express')
  , nib = require('nib')
  , sio = require('socket.io')
  , pong = require('./public/lib/pong');

/**
 * App.
 */

var app = express.createServer();

/**
 * App configuration.
 */

app.configure(function () {
  app.use(express.static(__dirname + '/public'));
  app.set('views', __dirname);
  
  // disable layout
  app.set("view options", {layout: false});
  
  /* make a custom html template */
  app.register('.html', {
    compile: function(str, options){
      return function(locals){
        return str;
      };
    }
  });
});

/**
 * App routes.
 */

app.get('/', function (req, res) {
  res.render('index.html');
});

/**
 * App listen.
 */

var port = process.env.PORT || 3000;
app.listen(port, function () {
  var addr = app.address();
  console.log('   app listening on http://' + addr.address + ':' + addr.port);
});

/**
 * Socket.IO server (single process only)
 */

var io = sio.listen(app, { log: false })
  , nicknames = {};

// Set our transports
io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 20); 
});

var state = { intervalId: 0, connections: 0 };

io.sockets.on('connection', function (socket) {
  
  socket.on('user message', function (msg) {
    socket.broadcast.emit('user message', socket.nickname, msg);
  });

  socket.on('nickname', function (nick, fn) {
    if (nicknames[nick]) {
      fn(true);
    } else {
      fn(false);

      pong.main( io, socket, state );
      
      nicknames[nick] = socket.nickname = nick;
      socket.broadcast.emit('announcement', nick + ' connected');
      io.sockets.emit('nicknames', nicknames);
    }
  });  
  
  socket.on('disconnect', function () {
    if (!socket.nickname) return;

    delete nicknames[socket.nickname];
    socket.broadcast.emit('announcement', socket.nickname + ' disconnected');
    socket.broadcast.emit('nicknames', nicknames);
  });
});
