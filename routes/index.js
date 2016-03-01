var express = require('express');
var googleStocks = require('google-stocks');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/', function(req, res){

	var stockName = req.body.stock;
	console.log("REQUESTING FOR: "+stockName);

	googleStocks.get([stockName], function(error, data) {
	  console.log("RECEIVED RESPONSE");
	  res.send(JSON.stringify(data));
	});


	//res.render('index', { title: stockName });
	//res.send('USE FOR API OR HTTP STATUS OR DIRECT JSON OBJECT');
	//req.query.param
});

module.exports = router;
