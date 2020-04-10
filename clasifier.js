const express = require('express')
const app = express()
const port = 3000
var natural = require('natural');
var dataset = require('./qa.json');
var cors = require('cors');
var classifier = new natural.BayesClassifier();
var salient = require('salient');
var glossary = new salient.glossary.Glossary();

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

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

app.post('/', async (req, res) => {
	let query = req.body.query
	for (let i = 0; i < dataset.length; i++) {
		let question = dataset[i].question
		let answer = dataset[i].answer
		let type = dataset[i].type
		for (let j = 0; j < question.length; j++) {
			classifier.addDocument(question[j], type);
		}
	}
	
	classifier.train();
	let classify_type = classifier.classify(query)
	let classifications = classifier.getClassifications(query)
	let answer
	if(classifications.length > 2){
		if (classifications[0].value < 0.02) {
			answer = dataset[dataset.length - 1].answer[getRandomInt(dataset[dataset.length - 1].answer.length)]
		}else{
			for (let i = 0; i < dataset.length; i++) {
				let type = dataset[i].type
				if(type == classify_type){
					answer = dataset[i].answer[getRandomInt(dataset[i].answer.length)]
				}
			}
		}
	}

	answer = Array.isArray(answer) ? answer : [answer]
	// glossary.parse("find nike air jordan usa");
	// let concept = glossary.concepts();
	return res.json(answer);
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))