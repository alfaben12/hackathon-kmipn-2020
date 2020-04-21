const fs = require('fs')
const pdf = require('@touno-io/pdf')
const express = require('express')
var natural = require('natural');
const app = express()
const port = 3000
const GoogleImages = require('google-images');
const nlp = require('compromise');
var gis = require('g-i-s');
var cors = require('cors');

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

const reduceNoun = async (text) => {
	return await nlp(text).nouns().json()
}

const blankGenText = async (str, text) => {
	return await text.toLowerCase().replace(str, '____');
}

const client = new GoogleImages('009039845094310497023:weh5dj4jjnk', 'AIzaSyB8pYQPY6KLDx7SVreOILwwPYdYreh4SUo');

let dataBuffer = fs.readFileSync('./History_of_Indonesia.pdf')
Tokenizer = require('nalapa').tokenizer;
app.use(express.json({limit: '50mb', extended: true}));

app.use(express.urlencoded({ extended: true,limit:'50mb',parameterLimit:500000 }));

function get_google_image(query){
	return new Promise((resolve, reject) => {
		client.search(query)
		.then(images => {
			resolve(images[0])
		})
	})
}

function get_question(sentence){
	return new Promise((resolve, reject) => {
		let qa_array = []
		reduceNoun(sentence)
		.then((data) => data.map(async str => {
			blankGenText(str.text.toLowerCase(), sentence)
			.then((ques) => qa_array.push({
				question: ques,
				answer: str.text
			}))
			.catch(err => reject(err));
		}))
		.catch(err => reject(err));
		
		resolve(qa_array)
	})
}

function img(query){
	return new Promise(resolve => {
		gis(query, function logResults(error, results) {
			// console.log(results[0])
			if (error) {
				resolve(null)
			}else{
				resolve(results[0])
			}
		});
	});
}

app.post('/', async (req, res) => {
	let query = req.body.query
	pdf(dataBuffer).then(async function(data) {
		data = data.text.replace(/(\r\n|\n|\r)/gm, "")
		data = data.replace(/(\r\t|\t|\r)/gm,' ')
		data = data.replace(/  +/g, ' ');
		let paragraph_array = Tokenizer.splitSentence(data)
		let split_sentence_array = paragraph_array.map(function(paragraph) {
			natural.PorterStemmer.attach();
			let split_sentence = Tokenizer.splitSentence(paragraph)
			return {
				sentence: paragraph,
				split_sentence: split_sentence
			}
		})
		
		let data_result = []
		for (let i = 0; i < split_sentence_array.length; i++) {
			let sentence = split_sentence_array[i].sentence;
			let split_sentence = split_sentence_array[i].split_sentence;
			// let split = split_sentence[0].split("or")[0];
			let sentence_split = sentence.split(",");
			let image = null
			// if (i % 3 == 1) {
				// image = await img(split)
				// image = await get_google_image(split)
			// }
			// console.log(split)
			
			data_result.push({
				sentence: sentence_split,
				// split: split,
				image: image,
				question: await get_question(sentence)
			})
		}
		return res.json(data_result)
	})
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
