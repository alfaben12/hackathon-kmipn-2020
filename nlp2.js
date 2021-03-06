const { NlpManager } = require('node-nlp');
const express = require('express')
const app = express()
const port = process.env.PORT || 3000
var dataset = require('./qa.json');
var dataset_questions = require('./question.json');
var cors = require('cors');
var salient = require('salient');
var glossary = new salient.glossary.Glossary();
var scraperjs = require('scraperjs');
var moment = require('moment');
const translate = require('@k3rn31p4nic/google-translate-api');
const path = require('path');

function transalte(text){
	return new Promise((resolve, reject) => {
		// translate(text, {from: 'id', to: 'en'},)
		// .then(res => {
		// 	resolve(res.text)
		// console.log(res.text);
		//=> I speak English
		// console.log(res.from.language.iso);
		//=> nl
		// })
		// .catch(err => {
		// 	console.error(err);
		// 	reject(err)
		// });
		
		translate(text, {from: 'id', to: 'en'}).then(res => {
			resolve(res.text)
		}).catch(err => {
			reject(err)
		});
	});
}

app.use(cors());
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
	// allow preflight
	
	if (req.method === 'OPTIONS') {
		res.send(200);
	} else {
		next();
	}
});

app.use(express.json({limit: '50mb', extended: true}));
app.use(express.urlencoded({ extended: true,limit:'50mb',parameterLimit:500000 }));

function getItemEbay(keyword){
	return new Promise((resolve, reject) => {
		scraperjs.StaticScraper.create('https://www.ebay.com/sch/i.html?_from=R40&_trksid=m570.l1313&_nkw='+ keyword +'&_sacat=0&LH_TitleDesc=0&_osacat=0&_odkw='+ keyword)
		.scrape(function($) {
			return $(".s-item__wrapper").map(function() {
				return {
					name: $(this).find('.s-item__title').text(),
					price: $(this).find('.s-item__price').text(),
					location: $(this).find('.s-item__location.s-item__itemLocation').text(),
					shipping_price: $(this).find('.s-item__shipping.s-item__logisticsCost').text(),
					img: $(this).find('.s-item__image-img').attr('src'),
					source: 'Ebay International'
				};
			}).get();
		})
		.then(function(data) {
			let item = []
			if(Array.isArray(data)){
				item = data.filter(function (n) { return n.name !== "" });
				item = item[0]
			}
			
			resolve(item)
		})
	})
}

function getItemHartono(keyword){
	return new Promise((resolve, reject) => {
		scraperjs.StaticScraper.create('https://myhartono.com/?subcats=Y&pcode_from_q=Y&pshort=Y&pfull=Y&pname=Y&pkeywords=Y&search_performed=Y&q='+ keyword +'&dispatch=products.search&security_hash=f1578b739e129349259d0e8e8d43b23f')
		.scrape(function($) {
			return $(".ty-grid-list__item.ty-quick-view-button__wrapper").map(function() {
				return {
					name: $(this).find('.product-title').text(),
					price: $(this).find('.ty-price-num').text(),
					location: 'From Indonesia',
					shipping_price: '0',
					img: $(this).find('.ty-pict.cm-image').attr('src'),
					source: 'HARTONO'
				};
			}).get();
		})
		.then(function(data) {
			let item = []
			if(Array.isArray(data)){
				item = data[0]
			}
			
			resolve(item)
		})
	})
}

function getItemElevenia(keyword){
	return new Promise((resolve, reject) => {
		scraperjs.StaticScraper.create('https://www.elevenia.co.id/search?q='+ keyword)
		.scrape(function($) {
			return $(".itemList").map(function() {
				return {
					name: $(this).find('.pordLink.notranslate').text(),
					price: $(this).find('.price.notranslate strong').text(),
					location: 'From Indonesia',
					shipping_price: '0',
					img: $(this).find('img').attr('src'),
					source: 'elevenia'
				};
			}).get();
		})
		.then(function(data) {
			let item = []
			if(Array.isArray(data)){
				item = data[0]
			}
			
			resolve(item)
		})
	})
}

function getItemNRCSport(keyword){
	return new Promise((resolve, reject) => {
		scraperjs.StaticScraper.create('https://www.ncrsport.com/shop/all/list/1?s='+ keyword)
		.scrape(function($) {
			return $(".productDiv").map(function() {
				return {
					name: $(this).find('.productName .normalFont.twoLine').text(),
					price: $(this).find('.mySalePrice').text(),
					location: 'From Indonesia',
					shipping_price: '0',
					img: $(this).find('.img-responsive.ls-is-cached.lazyloaded').attr('src'),
					source: 'ncrsport'
				};
			}).get();
		})
		.then(function(data) {
			let item = []
			if(Array.isArray(data)){
				item = data[0]
			}
			
			resolve(item)
		})
	})
}

function getItemBlanja(keyword){
	return new Promise((resolve, reject) => {
		scraperjs.StaticScraper.create('https://www.blanja.com/search?keywords='+ keyword +'&pageno=0&searchtype=product')
		.scrape(function($) {
			return $(".product-box").map(function() {
				return {
					name: $(this).find('.product-name').text(),
					price: $(this).find('.product-price').text(),
					location: 'From Indonesia',
					shipping_price: '0',
					img: "https:"+$(this).find('.product-image img.lazy').attr('data-original'),
					source: 'blanja.com'
				};
			}).get();
		})
		.then(function(data) {
			let item = []
			if(Array.isArray(data)){
				item = data[0]
			}
			
			resolve(item)
		})
	})
}

function getItemKaskus(keyword){
	return new Promise((resolve, reject) => {
		scraperjs.StaticScraper.create('https://www.kaskus.co.id/search/fjb?q='+ keyword)
		.scrape(function($) {
			return $(".item--grid.clearfix").map(function() {
				return {
					name: $(this).find('.item__description .title').text(),
					price: $(this).find('.item__description .price').text(),
					location: 'From Indonesia',
					shipping_price: '0',
					img: $(this).find('.item__image .image__photo ').css('background-image').split("(")[1].split(")")[0],
					source: 'fjbkaskus'
				};
			}).get();
		})
		.then(function(data) {
			let item = []
			if(Array.isArray(data)){
				item = data[0]
			}
			
			resolve(item)
		})
	})
}

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

const manager = new NlpManager({ languages: ['id'] });

for (let i = 0; i < dataset.length; i++) {
	let question = dataset[i].question
	let answer = dataset[i].answer
	let type = dataset[i].type
	for (let j = 0; j < question.length; j++) {
		manager.addDocument('id', question[j].toLowerCase(), type);
	}
	
	for (let j = 0; j < answer.length; j++) {
		manager.addAnswer('id', type, answer[j]);
	}
}

// Train and save the model.
(async() => {
	await manager.train();
	manager.save();
})();

app.get('/questions',function(req,res){
	return res.json(dataset_questions)
});

app.get('/',function(req,res){
	res.sendFile(path.join(__dirname+'/public/index.html'));
	//__dirname : It will resolve to your project folder.
});

app.post('/', async (req, res) => {
	
	let query = 'Mesin cuci'
	// let query = req.body.query.toLowerCase()
	
	return res.json({
		Ebay: await getItemEbay(query),
		Hartono: await getItemHartono(query),
		Elevenia: await getItemElevenia(query),
		NRCSport: await getItemNRCSport(query),
		Blanja: await getItemBlanja(query),
		Kaskus: await getItemKaskus(query)
	})
	let classifier = await manager.process('id', query);
	let classifications = classifier.classifications
	let intent = classifier.intent
	let answer
	if (intent == 'None') {
		if (classifications.length > 2) {
			if (classifications[1].intent == 'question') {
				for (let i = 0; i < dataset.length; i++) {
					let temp_type = dataset[i].type
					if(temp_type == classifications[1].intent){
						answer = dataset[i].answer[getRandomInt(dataset[i].answer.length)]
						type = dataset[i].type
					}
				}
			}else{
				answer = dataset[dataset.length - 1].answer[getRandomInt(dataset[dataset.length - 1].answer.length)]
				type = dataset[dataset.length - 1].type
			}
		}else{
			answer = dataset[dataset.length - 1].answer[getRandomInt(dataset[dataset.length - 1].answer.length)]
			type = dataset[dataset.length - 1].type
		}
	}else{
		for (let i = 0; i < dataset.length; i++) {
			let temp_type = dataset[i].type
			if(temp_type == intent){
				answer = dataset[i].answer[getRandomInt(dataset[i].answer.length)]
				type = dataset[i].type
			}
		}
	}
	
	function hasNumbers(t){
		var regex = /\d/g;
		return regex.test(t);
	}
	
	answer = Array.isArray(answer) ? answer : [answer]
	if(type == 'question'){
		let english_question = await transalte(query)
		let english_question_parse = glossary.parse(english_question);
		let object_name = glossary.concepts();
		let extract_number = query.match(/\d+/g) == null ? '' : query.match(/\d+/g)
		if (!hasNumbers(object_name[0])) {
			object_name = object_name[0] + " "+ extract_number.toString().replace(/,/g, " ");
		}
		item = await getItemEbay(object_name)
		if (item.length > 0) {
			answer[answer.length - 1] = answer[answer.length - 1].replace('{{item}}', item[0].name)
		}
	}else if (type == 'clock') {
		answer[answer.length - 1] = answer[answer.length - 1].replace('{{clock}}', moment().format('HH:mm'))
	}else if (type == 'date') {
		answer[answer.length - 1] = answer[answer.length - 1].replace('{{date}}', moment().format('DD MMMM YYYY'))
	}else{
		answer = answer
	}
	
	return res.json(answer);
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
