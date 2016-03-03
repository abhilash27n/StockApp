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
	var fromDate = req.body.fromDate;
	var toDate = req.body.toDate;
	console.log("REQUESTING FOR: "+stockName);


	//YAHOO FINANCE BEGIN  http://www.jarloo.com/yahoo_finance/
	yahooFinance.snapshot({
	  symbol: stockName,
	  fields: ['s', 'd1', 't1', 'l1', 'v'],
	}, function (err, snapshot) {
	  console.log("#############YAHOO FINANCE REQUEST#############");
	  console.log(snapshot);

	  var price = snapshot.lastTradePriceOnly;
	  var volume = snapshot.volume;

	  var tuple = { name: stockName, price: price, volume: volume };

	  //INSERTING INTO DATABASE
	   connection.query('INSERT INTO RealTime SET ?', tuple, function(err, res) {
		  if (!err)
		    console.log('Success inserting into database');
		  else
		    console.log('Error while performing Query.');
		});

	});
	//YAHOO FINANCE END

	//YAHOO FINANCE HISTORICAL BEGIN  
	yahooFinance.historical({
  		symbol: stockName,
  		from: fromDate,
  		to: toDate,
  		// period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only) 
	}, function (err, quotes) {
	  	console.log("#############YAHOO HISTORICAL REQUEST#############");
	  	console.log(quotes);
	  	console.log(quotes.length);

	  	//INSERTING ALL VALUES INTO DATABASE

	  	for(var i = 0; i < quotes.length; i++){

	  		var open = quotes[i].open;
	  		var high = quotes[i].high;
	  		var low = quotes[i].low;
	  		var close = quotes[i].close;
	  		var histtime = quotes[i].date;
	  		var volume = quotes[i].volume;

	  		var tuple = { name: stockName, open: open, high:high, low:low, close:close, histtime: histtime, volume: volume};

	  		connection.query('INSERT INTO Historical SET ?', tuple, function(err, res) {
			  if (!err)
			    console.log('Success inserting history into database');
			  else
			    console.log('Error while performing Query.');
			});
	  	}

	});
	//YAHOO FINANCE HISTORICAL END

	//GOOGLE STOCK BEGIN
	googleStocks.get([stockName], function(error, data) {
	  console.log("#############GOOGLE STOCK REQUEST#############");
	  console.log(data);

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
