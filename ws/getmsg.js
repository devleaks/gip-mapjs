// https://github.com/felixge/node-mysql
// npm install mysql
var mysql = require('mysql');

// http://nodejs.org/docs/v0.6.5/api/fs.html#fs.writeFile
var fs = require('fs');

var client = mysql.createConnection({
	hostname: 'localhost',
   user: 'gipcore',
   password: 'gipcore' 
});

client.query('select * from gipcore.wire;', function(err, results, fields) {
    if(err) throw err;

    fs.writeFile('wire.json', JSON.stringify(results, null, 2), function (err) {
      if (err) throw err;
      console.log('Saved!');
    });

    client.end();   
});