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
        console.log('received: %s', data.substr(0, 50) + '...');
        wss.clients.forEach(function each(client) {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });

    function sendmsg(j) {
        ws.send(JSON.stringify(j))
    }

    const tmax = 10000
    setTimeout(function() { // starts in 5000 msec
        sendmsg({ source: 'gip', type: 'news', subject: 'DASHBOARD TESTING STARTED...', priority: 5, icon: 'fa-info', "icon-color": 'accent' });
    }, 10);
    setTimeout(function() { // starts in 5000 msec
        sendmsg({ source: 'gip', type: 'news', subject: '... DASHBOARD TESTING COMPLETED!', body: "Please check the browser's console for log", priority: 2, icon: 'fa-info', "icon-color": 'success', timestamp: 1495470000000, speak: false });
    }, tmax);

    [ // test messages
        { source: 'gip', type: 'metar', body: 'EBLG 300450Z 34007KT 1600 RA BR FEW002 BKN003 15/13 Q1005 TEMPO 1200 RADZ BKN002', subject: 'Metar EBLG 300450Z', priority: 1, icon: 'fa-cloud', "icon-color": 'info' },
        {
            source: 'gip',
            type: 'lorem',
            ack: true,
            body: 'Quaestione igitur per multiplices dilatata fortunas cum ambigerentur quaedam, non nulla levius actitata constaret, post multorum clades Apollinares ambo pater et filius in exilium acti cum ad locum Crateras nomine pervenissent, villam scilicet suam quae ab Antiochia vicensimo et quarto disiungitur lapide, ut mandatum est, fractis cruribus occiduntur.' +
                'Alii nullo quaerente vultus severitate adsimulata patrimonia sua in inmensum extollunt, cultorum ut puta feracium multiplicantes annuos fructus, quae a primo ad ultimum solem se abunde iactitant possidere, ignorantes profecto maiores suos, per quos ita magnitudo Romana porrigitur, non divitiis eluxisse sed per bella saevissima, nec opibus nec victu nec indumentorum vilitate gregariis militibus discrepantes opposita cuncta superasse virtute.' +
                'Ac ne quis a nobis hoc ita dici forte miretur, quod alia quaedam in hoc facultas sit ingeni, neque haec dicendi ratio aut disciplina, ne nos quidem huic uni studio penitus umquam dediti fuimus. Etenim omnes artes, quae ad humanitatem pertinent, habent quoddam commune vinculum, et quasi cognatione quadam inter se continentur.',
            subject: 'Lorem Ipsum — Extra Link Tester',
            priority: 1,
            icon: 'fa-info',
            "icon-color": 'default'
        },
        { source: 'aodb', type: 'qfu', subject: "QFU Changed to 05", priority: 6, icon: "fa-plane" },
        { source: 'aodb', type: 'notam', subject: "A1234/06 NOTAMR A1212/06", body: "A1234/06 NOTAMR A1212/06<br/>Q)EGTT/QMXLC/IV/NBO/A/000/999/5129N00028W005<br/>A)EGLL<br/>B)0609050500<br/>C)0704300500<br/>E)DUE WIP TWY B SOUTH CLSD BTN 'F' AND 'R'. TWY 'R' CLSD BTN 'A' AND 'B' AND DIVERTED VIA NEW GREEN CL AND BLUE EDGE LGT.<br/>CTN ADZ", priority: 4, icon: 'fa-plane', "icon-color": 'warning' }
    ].forEach(function(msg, idx) {
        setTimeout(function() { // starts in 5000 msec
            sendmsg(msg);
        }, tmax * Math.random());
    })

});

const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();

        ws.isAlive = false;
        ws.ping('', false, true);
    });
}, 30000);