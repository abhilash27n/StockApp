var express = require('express');
var mysql = require('mysql');
var CronJob = require('cron').CronJob;
var googleStocks = require('google-stocks');
var yahooFinance = require('yahoo-finance');
var router = express.Router();

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'stockuser',
  password : 'password',
  database : 'stockSchema'
});

var count = 0;
/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("The session is "+req.session.secret);
  if(req.session.secret) {
  	res.render('stockSelectionPage',{});
  }
  else{
  	res.render('login');
  } 
  	
});

router.post('/login', function(req, res, next) {
  var userid = req.body.userid;
  var pswd = req.body.pswd;

  query = "select userid, pswd, fullname from Users where userid = \""+userid+"\"  and "+"pswd = \""+pswd+"\";";
  console.log(query);

  //var sess = req.session;

  //console.log(req.session);

  connection.query(query, function(err, rows, fields) {
  	if(err) {
  		// Say user invalid in Login Page
  		console.log("Some Login Error, Check Database Config.");
  	}
  	else {
  		// Set Session here
  		// There is a match, redirect page to Main Page
  		if(rows.length==1) {
  			req.session.secret = userid;
  			//console.log(rows);
  			console.log("user valid");
  			res.render('stockSelectionPage');
  		}
  		else {
  			console.log("user invalid");
  			res.render('login');
  		}
  	}
  });

});

//GET ALL Stocks
router.get('/getAllStocks', function(req, res, next) {
	var user = req.query.user;
	var query;
	if(user == "ALL"){
		query = 'select stockid as id, stockname as text from Stocks';
	}else{
		query = 'select s.stockid as id, s.stockname as text from Stocks s, Portfolio p where s.stockid = p.stockid and p.userid = "'+user+'"';
	}
	console.log(query);
	connection.query(query, function(err, rows, fields) {
		if (!err){
			res.send(JSON.stringify(rows));
		}
		else
		    console.log('Error while getting all stocks for: '+user);
	});
});

//GET realtime stock data for chart - API
router.get('/getRealTimeStockData', function(req, res, next){
	var stockName = req.query.stock;
	//TODO - ERROR CHECKING
	//console.log(stockName);
	var query = 'select unix_timestamp(realtime) as time, price from RealTime where stockid = "'+ stockName +'" order by time';

	connection.query(query, function(err, rows, fields) {
		if (!err){
		    noRows = rows.length;
		    
		    //console.log("No of songs returned: "+no_songs);
		    if(noRows == 0){
		    	//No songs returned
		    	res.send(JSON.stringify("NoRowsReturned"));
		    }
		    else{
		    	var open = "?(";
		    	var table = [];
		    	for(var i = 0; i < rows.length; i++){
		    		var time = rows[i].time*1000;
		    		var price = rows[i].price;

		    		var value = [];
		    		value.push(time);
		    		value.push(price);
		    		table.push(value);

		    	}
			    res.send(JSON.stringify(table));
		   }
		    
		}
		else
		    console.log('Error while performing realtime stock request query.');
	});


});


//GET historical stock data for chart - API
router.get('/getHistoricalStockData', function(req, res, next){
	var stockName = req.query.stock;
	//TODO - ERROR CHECKING
	//console.log(stockName);
	var query = 'select unix_timestamp(histtime) as time, close as price from Historical where stockid = "'+ stockName +'" order by time';

	connection.query(query, function(err, rows, fields) {
		if (!err){
		    noRows = rows.length;
		    
		    //console.log("No of songs returned: "+no_songs);
		    if(noRows == 0){
		    	//No songs returned
		    	res.send(JSON.stringify("NoRowsReturned"));
		    }
		    else{
		    	var open = "?(";
		    	var table = [];
		    	for(var i = 0; i < rows.length; i++){
		    		var time = rows[i].time*1000;
		    		var price = rows[i].price;

		    		var value = [];
		    		value.push(time);
		    		value.push(price);
		    		table.push(value);

		    	}
			    res.send(JSON.stringify(table));
		   }
		    
		}
		else
		    console.log('Error while performing historical stock request query.');
	});


});

router.get('/histDataAdd', function(req, res){
	res.render('addHistoricalData');
});

//Add historical Data to database
router.post('/addHistoricalData', function(req, res){

	var stockName = req.body.stock;
	var fromDate = req.body.fromDate;
	var toDate = req.body.toDate;
	console.log("REQUESTING FOR: "+stockName);


	//YAHOO FINANCE BEGIN  http://www.jarloo.com/yahoo_finance/
	/*yahooFinance.snapshot({
	  symbol: stockName,
	  fields: ['s', 'd1', 't1', 'l1', 'v'],
	}, function (err, snapshot) {
	  console.log("#############YAHOO FINANCE REQUEST#############");
	  console.log(snapshot);

	  var price = snapshot.lastTradePriceOnly;
	  var volume = snapshot.volume;

	  var tuple = { stockid: stockName, price: price, volume: volume };

	  //INSERTING INTO DATABASE
	   connection.query('INSERT INTO RealTime SET ?', tuple, function(err, res) {
		  if (!err)	
		  	console.log('Success inserting into database');		    
		  else
		    console.log('Error while performing Query.');
		});

	});*/
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

	  		var tuple = { stockid: stockName, open: open, high:high, low:low, close:close, histtime: histtime, volume: volume};

	  		connection.query('INSERT INTO Historical SET ?', tuple, function(err, res) {
			  if (!err)
			    console.log('Success inserting history into database');
			  else
			    console.log('Error while inserting historical data.');
			});
	  	}

	});
	//YAHOO FINANCE HISTORICAL END

	//GOOGLE STOCK BEGIN
	/*googleStocks.get([stockName], function(error, data) {
	  console.log("#############GOOGLE STOCK REQUEST#############");
	  console.log(data);

	   res.send(JSON.stringify(data));
	});*/
	//GOOGLE STOCK END

	//res.render('index', { title: stockName });
	//res.send('USE FOR API OR HTTP STATUS OR DIRECT JSON OBJECT');
	//req.query.param
});

//REAL TIME DATA REQUEST

//TODO - fix calling when stocks are closed(duplicate check or something)
new CronJob('0 * * * * *', function() {

	console.log("CALLING STOCK EVERY MINUTE");	
    var stockNames = ["GOOG", "YHOO", "TSLA", "FB", "AAPL"];

	for(var i = 0; i < stockNames.length; i++){
	  //YAHOO FINANCE BEGIN  http://www.jarloo.com/yahoo_finance/
		yahooFinance.snapshot({
		  symbol: stockNames[i],
		  fields: ['s', 'd1', 't1', 'l1', 'v'],
		}, function (err, snapshot) {
		  //console.log("#############YAHOO FINANCE REQUEST FROM SCHEDULER#############");
		  //console.log(snapshot);

		  var price = snapshot.lastTradePriceOnly;
		  var volume = snapshot.volume;
		  var symbol = snapshot.symbol;
		  var date = snapshot.lastTradeDate;
		  var time = snapshot.lastTradeTime;

		  if(time.slice(-2)=='am'){
		  	if(time.split(':') == "12"){
		  		date.setHours(parseInt(time.split(':')[0]) + 12);	
		  	}
		  	else{
		  		date.setHours(parseInt(time.split(':')[0]));
		  	}
		  }
		  else{
		  	if(time.split(':') == "12"){
		  		date.setHours(parseInt(time.split(':')[0]));
		  	}
		  	else{
		  		date.setHours(parseInt(time.split(':')[0]) + 12);	
		  	}
		  }
		  
		  //converting string time into database datetime
		  date.setMinutes(parseInt(time.split(':')[1].slice(0,2)));


		  var tuple = { stockid: symbol, price: price, volume: volume, realtime: date };
		  //console.log(tuple);
		  //INSERTING INTO DATABASE
		   connection.query('INSERT INTO RealTime SET ?', tuple, function(err, res) {
			if (!err){
		  		//console.log('Success inserting into database');
		  		count++;
		  		if(count % 5 == 0)
		  			console.log("Inserted "+count/5+" times");
		  	}
			else
			    console.log('Error while inserting real time data.');
			});

		});
	}
	//YAHOO FINANCE END
}, null, true, 'America/New_York');


process.on( 'SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  connection.end();
  process.exit( );
});

module.exports = router;
