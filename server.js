var express = require('express');
var ejs = require('ejs');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var rooms = {};
var roomId = 0;



app.set('view engine', 'ejs');
app.use("/assets", express.static(__dirname + '/assets'));
app.use("/views", express.static(__dirname + '/views'));
app.use("/node_modules", express.static(__dirname + '/node_modules'));

function getRoom(contributorId){
	for(var key in rooms){
		if(rooms[key].getContributor(contributorId) !== undefined && rooms[key].getContributor(contributorId) !== null){
			return key;
		}
	}
	return null;
}

var Room = function(){
	this.nbrOfContribs = 0;
	this.id = ++roomId;
	this.contributors = {};
};

Room.prototype.getId = function(){
	return this.id;
};

Room.prototype.addContributor = function (newContributor){
	console.log(">>>> Add contrubutor : " + newContributor.getPeerId());
	this.contributors[newContributor.getKey()] = newContributor;
	this.nbrOfContribs ++;
};

Room.prototype.getContributor = function(contributorId){
	return this.contributors[contributorId];
};

Room.prototype.getAllPeerIDs = function(){
	peerIds = new Array();
	for(var id in this.contributors){
		peerIds.push(this.contributors[id].getPeerId());
	}
	console.log(peerIds);
	return peerIds;
};

Room.prototype.removeContributor = function(contributorID){
	if(contributorID in this.contributors){
		delete this.contributors[contributorID];
		this.nbrOfContribs --;
		console.log(this.nbrOfContribs);
		console.log(">>>> A contributor has been deleted : " + contributorID);
		console.log(this.contributors);
	}

};

Room.prototype.isEmptyRoom = function(){
	if(this.nbrOfContribs === 0){
		return true;
	}else{
		return false;
	}
};

var initRooms = function(){
	rooms["1"] = new Room();
	console.log(">>>> Init rooms : Add room demo");
	console.log(rooms)
};

var Contributor = function(socket, peerId){
	this.key = socket.id;
	this.peerId = peerId;
};

Contributor.prototype.getKey = function(){
	return this.key;
};

Contributor.prototype.getPeerId = function(){
	return this.peerId;
};

initRooms();

app.get('/', function(req, res) {
	res.render('index.ejs');
});

app.get('/new-room', function(req, res){
	var newRoom = new Room();
	var id = newRoom.getId();
	rooms[id] = newRoom;
	res.redirect('/room/' + id);
});

app.get('/room/:id', function(req, res){
	var id = req.params.id;
	res.render('room.ejs',{roomId : id});
});



io.on('connection', function(socket){

	socket.on('new_peer', function(infoPeer){
		console.log(infoPeer.peerId);
		console.log(">>>> Connection of a peer : " , infoPeer.peerId);
		if(infoPeer.roomId in rooms){
			console.log(">>>> Room exists");

			var infoPeerIds = rooms[infoPeer.roomId].getAllPeerIDs();
			this.emit('infoPeerIds', infoPeerIds);

			var newContributor = new Contributor(this, infoPeer.peerId);
			rooms[infoPeer.roomId].addContributor(newContributor);
		}else{
			console.log(">>>> WARNING : room doesn't seem to exist");
			this.emit('error_server', 'Room doesn\'t exist !');
		}
		
	});

	socket.on('disconnect', function () {
		console.log(">>>> Peer deconnection : " + this.id);
		var key = getRoom(this.id);
		if(key !== null){
			rooms[key].removeContributor(this.id);
			if(rooms[key].isEmptyRoom() && key !== "1"){
				console.log(">>>> Room " + key + " is deleted !");
				delete rooms[key]; //All empty rooms are deleted except the demonstration room
			}
		}else{
			console.log(">>>> WARNING : Peer doesn't exist !");
		}
		
	});

});


http.listen(3000, function(){
  	console.log('listening on *:3000');
});
