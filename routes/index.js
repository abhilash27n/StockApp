var express = require('express');
var mysql = require('mysql');
var CronJob = require('cron').CronJob;
var googleStocks = require('google-stocks');
var yahooFinance = require('yahoo-finance');

//Bridge API for Java-Node.js
var java = require('java');
//Required to locate jar files for java module
var path = require('path');
java.classpath.push(path.join(__dirname, "../java/BayesianStockPredictor.jar"));
java.classpath.push(path.join(__dirname, "../java/Jama-1.0.2.jar"));
java.classpath.push(path.join(__dirname, "../java/commons-math3-3.6.jar"));

var router = express.Router();

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'stockuser',
  password : 'password',
  // user   : 'root',
  // password: 'root',
  database : 'stockSchema'
});

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("The session is "+req.session.secret);
  if(req.session.secret) {
  	res.render('portfolioPage',{userid: req.session.secret, username: req.session.fullName});
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
  			req.session.fullName = rows[0].fullname;
  			//console.log(rows);
  			console.log("user valid");
  			res.render('portfolioPage', {userid: req.session.secret, username: req.session.fullName});
  		}
  		else {
  			console.log("user invalid");
  			res.render('login');
  		}
  	}
  });

});

router.get('/stockSelectionPage', function(req, res, next) {
	if(req.session.secret=="")
		res.render('login');
	else
		res.render('stockSelectionPage', {userid: req.session.secret, username: req.session.fullName});
});

router.get('/portfolioPage', function(req, res, next) {
	if(req.session.secret=="")
		res.render('login');
	else
		res.render('portfolioPage', {userid: req.session.secret, username: req.session.fullName});
});

router.get('/logout', function(req, res, next) {
	req.session.secret="";
	res.render('login');
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

//TO BUY OR SELL STOCK
router.post('/buyOrSell', function(req, res, next) {
	var user = req.body.userid;
	var stockId = req.body.hiddenStockId;
	var buyOrSell = req.body.hiddenBuySell;
	var query;
	if(buyOrSell == "buy"){
		query = 'insert into Portfolio(stockid, userid) values("'+stockId+'","'+user+'")';
	}else{
		query = 'delete from Portfolio where userid = "'+user+'" and stockid = "'+stockId+'"';
	}
	console.log(query);
	connection.query(query, function(err, rows, fields) {
		if (!err){
			console.log("Success buying/selling");
			res.send("SUCCESS");
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


//GET On Balance Volume for Chart - API
router.get('/onBalanceVolume', function(req, res, next){
	var stockName = req.query.stock;
	//TODO - ERROR CHECKING
	//console.log("Stock Id: "+stockName);
	var query = 'select unix_timestamp(histtime) as time, volume, close from Historical where stockid= "'+ stockName +'" order by histtime desc limit 30';

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
		    	var currObv = 0;
		    	for(var i=1; i<rows.length;i++){
		    		if(rows[i].close>rows[i-1].close) {
		    			currObv += rows[i].volume; 
		    		} 
		    		else if(rows[i].close<rows[i-1].close) {
		    			currObv -= rows[i].volume;
		    		}
		    		else {
		    			currObv += 0;
		    		}

		    		var time = rows[i].time*1000;
		    		var value = [];
		    		value.push(time);
		    		value.push(currObv);
		    		table.push(value);
		    	}

			    res.send(JSON.stringify(table));
		   }		    
		}
		else
		    console.log('Error while performing realtime stock request query.');
	});
});



//GET Simple Moving Average for Chart - API
router.get('/simpleMovingAverage', function(req, res, next){
	var stockName = req.query.stock;
	//var timePeriod = req.query.period;
	var timePeriod = 50; // Most Commonly used
	//TODO - ERROR CHECKING
	//console.log("Stock Id: "+stockName);
	var query = 'select unix_timestamp(histtime) as time, close from Historical where stockid= "'+ stockName +'" order by histtime LIMIT 400';

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
		    	var movAvg = 0;
		    	var total = 0;
		    	var index = 0;
		    	
		    	if(rows.length>timePeriod) {
		    		for(var i=0;i<timePeriod;i++)
		    			total+=rows[i].close;
		    		var value = [];
		    		value.push(index);
		    		value.push(total/timePeriod);
		    		index+=1;
		    		table.push(value);

		    		for(var i=timePeriod;i<rows.length;i++,index++) {
		    			total = total + rows[i].close - rows[i-timePeriod].close;
		    			value = [];
		    			value.push(index);
		    			value.push(total/200);
		    			table.push(value);
		    		}
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

//GET Request
//For a given stock, get a short term prediction using Bayesian curve fitting
router.get('/getBayesianPrediction', function(req, res, next){
	var stockName = req.query.stock;
	
	var query = 'select unix_timestamp(realtime) as time, price from RealTime where stockid= "'+stockName+'" order by time desc limit 300;';

	connection.query(query, function(err, rows, fields) {
		if (!err){
		    noRows = rows.length;
		    
		    console.log("No of rows returned: "+noRows);
		    if(noRows == 0){
		    	res.send(JSON.stringify("NoRowsReturned"));
		    }
		    else{
		    	var prices = [];

		    	for(var i = 0; i < rows.length; i++){
		    		var price = rows[i].close;
		    		prices.push(price);

		    	}

		    	//console.log(prices[0]);
		    	var newPrices = java.newArray("double",prices);
		    	var BPInstance = java.newInstanceSync('BayesianStockPredictor');
				BPInstance.getPrediction(newPrices,function(err, data){
					if(err){
						console.log(err);
						return;
					}
					else
					{
						var time = rows[0].time;
						var table = [];
						for(var i=0; i < 60; i++)
						{
							var t = time + 60*(i+1);
							table.push([t, data[i]]);
						}
						res.send(JSON.stringify(table));
					}
				});
		   }
		    
		}
		else
		    console.log('Error while performing realtime stock request query.');
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
		  	}
			else
			    console.log('Error while inserting real time data.');
			});

		});
	}
	//YAHOO FINANCE END
}, null, true, 'America/New_York');


process.on( 'SIGINT', function() {
  console.log( "\nGracefully shutting down form SIGINT (Ctrl-C)" );
  connection.end();
  process.exit( );
});

module.exports = router;
