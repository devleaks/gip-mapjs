const WebSocket = require('ws');

const wss = new WebSocket.Server({
	host: 'localhost',
	port: 8051
});

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', function connection(ws) {
  ws.isAlive = true;

  ws.on('pong', heartbeat);

  ws.on('message', function incoming(data) {
    // Broadcast to everyone else.
    console.log('received: %s', data.substr(0, 50)+'...');
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.send(JSON.stringify({
	    "id": 0,
	    "subject": "Welcome",
	    "body": "Websocket connected. Welcome message was sent through it.",
	    "link": "",
	    "payload": null,
	    "payload_json": null,
	    "priority": 1,
	    "icon": "fa-cogs",
	    "icon-color": "info",
	    "status": "ACTIVE"
  }))

});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping('', false, true);
  });
}, 30000);