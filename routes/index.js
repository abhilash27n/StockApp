var express = require('express');
var mysql = require('mysql');
var googleStocks = require('google-stocks');
var router = express.Router();

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'stockuser',
  password : 'password',
  database : 'stockSchema'
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', function(req, res){

	var stockName = req.body.stock;
	console.log("REQUESTING FOR: "+stockName);

	googleStocks.get([stockName], function(error, data) {
	  console.log("RECEIVED RESPONSE");

	  connection.query('SELECT * from Historical', function(err, rows, fields) {
		  if (!err)
		    console.log('The solution is: ', rows);
		  else
		    console.log('Error while performing Query.');
		});


	   res.send(JSON.stringify(data));
	});


	//res.render('index', { title: stockName });
	//res.send('USE FOR API OR HTTP STATUS OR DIRECT JSON OBJECT');
	//req.query.param
});


process.on( 'SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  connection.end();
  process.exit( );
});

module.exports = router;
