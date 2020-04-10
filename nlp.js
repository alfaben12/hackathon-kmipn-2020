const express = require('express')
const app = express()
const port = 3000
var natural = require('natural');
var dataset = require('./qa.json');
var cors = require('cors');
var classifier = new natural.BayesClassifier();
var salient = require('salient');
var glossary = new salient.glossary.Glossary();
var scraperjs = require('scraperjs');
var moment = require('moment');
const translate = require('@k3rn31p4nic/google-translate-api');

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

function getItemEbay(keyword){
	return new Promise((resolve, reject) => {
		scraperjs.StaticScraper.create('https://www.ebay.com/sch/i.html?_from=R40&_trksid=m570.l1313&_nkw='+ keyword +'&_sacat=0&LH_TitleDesc=0&_osacat=0&_odkw='+ keyword +'')
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
		.then(function(data) {
			let item = data.filter(function (n) { return n.name !== "" });
			resolve(item)
		})
	})
}
function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
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

for (let i = 0; i < dataset.length; i++) {
	let question = dataset[i].question
	let answer = dataset[i].answer
	let type = dataset[i].type
	for (let j = 0; j < question.length; j++) {
		classifier.addDocument(question[j], type);
	}
}

classifier.train();

app.post('/', async (req, res) => {
	let query = req.body.query
	
	let classify_type = classifier.classify(query)
	let classifications = classifier.getClassifications(query)
	let answer
	let type
	if(classifications.length > 2){
		if (classifications[0].value < 0.03) {
			answer = dataset[dataset.length - 1].answer[getRandomInt(dataset[dataset.length - 1].answer.length)]
			type = dataset[dataset.length - 1].type
		}else{
			for (let i = 0; i < dataset.length; i++) {
				let temp_type = dataset[i].type
				if(temp_type == classify_type){
					answer = dataset[i].answer[getRandomInt(dataset[i].answer.length)]
					type = dataset[i].type
				}
			}
		}
	}
	
	function hasNumbers(t){
		var regex = /\d/g;
		return regex.test(t);
	}  
	let item
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
	
	return res.json(classifications);
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))