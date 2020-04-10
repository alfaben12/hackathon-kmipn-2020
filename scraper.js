
const express = require('express')
const app = express()
const port = 3000
const scrapeIt = require("scrape-it")
var scraperjs = require('scraperjs');
let cheerio = require('cheerio')
var osmosis = require('osmosis');

app.get('/', async (req, res) => {
	let query = req.query.q
	scraperjs.StaticScraper.create('https://www.ebay.com/sch/i.html?_from=R40&_trksid=m570.l1313&_nkw='+ query +'&_sacat=0&LH_TitleDesc=0&_osacat=0&_odkw='+ query +'')
	.scrape(function($) {
	    return $(".s-item__wrapper .clearfix").map(function() {
			return {
	            name: $(this).find('.s-item__title').text(),
	            price: $(this).find('.s-item__price').text(),
	            location: $(this).find('.s-item__location.s-item__itemLocation').text(),
	            shipping_price: $(this).find('.s-item__shipping.s-item__logisticsCost').text()
	        };
		}).get();
	})
	.then(function(news) {
	    let accounts = news.filter(function (n) { return n.name !== "" });
		return res.json(accounts);
	})
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`))