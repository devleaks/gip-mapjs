const WebSocket = require('ws');
var messages = require('./wire1.js')

const ws = new WebSocket('ws://localhost:8051');

ws.on('open', function open() {
	messages.forEach(function(m) {
		console.log(m.id)
		ws.send(JSON.stringify(m))
	});
});