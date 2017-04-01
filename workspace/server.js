//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

var stored="";

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];

var sql = require('mssql');

sql.close();

var cameras = [];
var users = [];

var videofeeds=[];



function storeCameras(c){
  console.log("in store camera")
  for (var i=0;i<c.length;i++) {
    console.log("storing camera" + c[i]);
    cameras.push(c[i]);
  }
}
function storeUsers(c){
  for (var i=0;i<c.length;i++) {
    console.log("storing User" + c[i]);
    cameras.push(c[i]);
  }
}
///////////////////////////////////////////////////////DB

sql.connect("mssql://brendan:1brendan1@masatrump.co4trqkiqsku.us-east-1.rds.amazonaws.com:1433/masa", err => {
  if(err)throw err;
    // ... error checks 
 
    // Query 
 
    new sql.Request().query('SELECT * FROM Users', (err, result) => {
        if(err)throw err;
        //console.log(JSON.stringify(result));
        for(var i=0;i<result.recordsets.length;i++){
          users.push(result.recordsets[i]);
        }
        console.log("users"+JSON.stringify(users));
    });
    
    new sql.Request().query('SELECT * FROM Cameras', (err, result) => {
        if(err)throw err;
        console.log(JSON.stringify(result));
        for(var i=0;i<result.recordsets.length;i++){
          cameras.push(result.recordsets[i]);
        }
        console.log("cameras"+JSON.stringify(cameras));
    });
 
});
 
sql.on('error', err => {
    if(err)throw err;
    
});



// function getUsers(callback){
  
//   var value=0; //not used gets all pages in server
  
//   sql.connect("mssql://brendan:1BrenShell1@masa.co4trqkiqsku.us-east-1.rds.amazonaws.com:1433").then(function() {
//     masa.co4trqkiqsku.us-east-1.rds.amazonaws.com:1433
//     new sql.Request()
//     .input('SignID', value)
//     .execute('sp_GetSigns').then(function(recordsets) {
//       callback(recordsets);
//         for (var i=0;i<recordsets.length;i++){
//           storeSign(recordsets[i]);
//         }
        
//     }).catch(function(err) {
//       console.log("Error " + err);
//       return null;
//     });
//     //
//   });
  
//   return true;
// }
//////////////////////////////////////////////////////////
// doshit();
// function doshit(){
//   sql.close();
//   getCameras(function(data){
    
//   });
//   sql.close();
//   getUsers(function(data){
      
//   });
// }

function validateUser(data){
 
}

 
io.on('connection', function (socket) {
  
    // socket.on("User_Login")
  
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    socket.image="";
    sockets.push(socket);
    
    socket.on('get_image', function (data) {

            socket.emit('image_server',stored);

    });
    
    socket.on('server_image', function (data) {

            //socket.emit('image_server',stored);
            stored=data;
      
    });

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });
    
    socket.on('User_Login', function(data){
        console.log("------------------------------------------------------jksfdfdfddsfafdfddfsafdsjfds");
        var usernameCheck = data.username;
        var passwordCheck = data.password;
        console.log("usernmae shitttt" + data.username + data.password);
        console.log("usersssssssss" + JSON.stringify(users[0]));
          for(var i =0; i < users[0].length; i++){
            console.log("username-------------" + users[0][i].username)
            if(users[0][i].username == usernameCheck){
              console.log("valid username now checking password");
              if(users[0][i].password == passwordCheck){
                console.log("good password log in user")
                socket.emit('Validated', { user: users[0][i], cams: cameras });
                break;
              }
            }
          }
          
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
