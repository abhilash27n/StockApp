var express = require('express');
var mysql = require('mysql');
var googleStocks = require('google-stocks');
var yahooFinance = require('yahoo-finance');
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


	//YAHOO FINANCE BEGIN
	yahooFinance.snapshot({
	  symbol: stockName,
	  fields: ['s', 'n', 'd1', 'l1', 'y', 'r'],
	}, function (err, snapshot) {
	  console.log("#############YAHOO FINANCE REQUEST#############");
	  console.log(snapshot);
	});
	//YAHOO FINANCE END

	//YAHOO FINANCE HISTORICAL BEGIN
	yahooFinance.historical({
  		symbol: stockName,
  		from: '2012-01-01',
  		to: '2012-01-05',
  		// period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only) 
	}, function (err, quotes) {
	  	console.log("#############YAHOO FINANCE REQUEST#############");
	  	console.log(quotes);
	});
	//YAHOO FINANCE HISTORICAL END

	//GOOGLE STOCK BEGIN
	googleStocks.get([stockName], function(error, data) {
	  console.log("#############GOOGLE STOCK REQUEST#############");

	  connection.query('SELECT * from Historical', function(err, rows, fields) {
		  if (!err)
		    console.log('The solution is: ', rows);
		  else
		    console.log('Error while performing Query.');
		});


	   res.send(JSON.stringify(data));
	});
	//GOOGLE STOCK END

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
