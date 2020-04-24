const say = require('say')
const fs = require('fs')
const pdf = require('@touno-io/pdf')
const express = require('express')
var natural = require('natural');
const app = express()
const port = process.env.PORT || 3000
const GoogleImages = require('google-images');
const nlp = require('compromise');
var gis = require('g-i-s');
var cors = require('cors');
const download = require('image-downloader')
const path = require('path');
const sharp = require('sharp');
var now = require("performance-now")

var videoshow = require('videoshow')
let ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
let ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
app.use('/files', express.static('files'))
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

const client = new GoogleImages('009039845094310497023:weh5dj4jjnk', 'AIzaSyB8pYQPY6KLDx7SVreOILwwPYdYreh4SUo');
let file = 'History_of_Indonesia.pdf'
let dataBuffer = fs.readFileSync('./'+file)
Tokenizer = require('nalapa').tokenizer;
app.use(express.json({limit: '50mb', extended: true}));

app.use(express.urlencoded({ extended: true,limit:'50mb',parameterLimit:500000 }));

async function downloadIMG(options) {
	try {
		await download.image(options)
		console.log('Success') // => /path/to/dest/image.jpg
	} catch (e) {
		options.url = 'https://www.bookwallah.org/wp-content/uploads/2015/09/no-img-300x188.jpg'
		await download.image(options)
		console.log('Not found') // => /path/to/dest/image.jpg
	}
	
	// download.image(options)
	// .then(({ filename, image }) => {
	// 	console.log('Saved to', filename)  // Saved to /path/to/dest/photo.jpg
	// })
	// .catch(async (err) => {
	// 	options.url = 'https://www.bookwallah.org/wp-content/uploads/2015/09/no-img-300x188.jpg'
	// 	await download.image(options)
	// 	console.error(options)
	// })
}

async function time_elapsed_speech(text) {
	let start = now(); 
	return new Promise((resolve, reject) => {
		say.speak(text, 'Samantha', 4, (err) => {
			let timeElapsed = ((now() - start) * 4) / 1000
			if (err) {
				return console.error(err)
			}
			return resolve(timeElapsed)
		});
	})
}

async function resizingIMG(file, new_file, index){
	return new Promise((resolve, reject) => {
		return sharp(file).resize({
			height: 1080,
			width: 1920
		}).toFile(new_file)
		.then(function(newFileInfo) {
			console.log("Image Resized " +index);
			resolve('Image Resized')
			// fs.unlinkSync(file)
		})
		.catch(function(err) {
			console.log(err);
		});
	});
}

const reduceNoun = async (text) => {
	return await nlp(text).nouns().json()
}

const blankGenText = async (str, text) => {
	return await text.toLowerCase().replace(str, '____');
}

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
				resolve({
					url: 'https://www.bookwallah.org/wp-content/uploads/2015/09/no-img-300x188.jpg'
				})
			}else{
				resolve(results[0])
			}
		});
	});
}

function create_audio(text, path) {
	return new Promise((resolve, reject) => {
		return say.export(text, 'Samantha', 0.9, path, (err) => {
			if (err) {
				return console.error(err)
			}
			resolve('mp3 exported')
			console.log('Exported mp3')
		})
	})
}

app.get('/hello', async (req, res) => {
	return res.json('hallo')
});

app.post('/', async (req, res) => {
	let query = req.body.query
	var dir = './files/'+ query;
	
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}
	
	pdf(dataBuffer).then(async function(data) {
		text = data.text.replace(/(\r\n|\n|\r)/gm, "")
		text = text.replace(/(\r\t|\t|\r)/gm,' ')
		text = text.replace(/  +/g, ' ');
		let paragraph_array = Tokenizer.splitSentence(text)
		
		let split_sentence_array = paragraph_array.map(function(paragraph) {
			natural.PorterStemmer.attach();
			let split_sentence = Tokenizer.splitSentence(paragraph)
			return {
				sentence: paragraph,
				split_sentence: split_sentence
			}
		})
		
		let data_result = []
		for (let i = 0; i < paragraph_array.length; i++) {
			let sentence = split_sentence_array[i].sentence;
			let split_sentence = split_sentence_array[i].split_sentence;
			let split = split_sentence[0].split(" or ")[0];
			let sentence_split = sentence.split(",");
			let image = null
			// if (i % 3 == 1) {
			image = await img(split)
			// image = await get_google_image(split)
			// }
			
			data_result.push({
				sentence: sentence,
				sentence_split: sentence_split,
				split: split,
				image: image.url.split('?')[0],
				question: await get_question(sentence)
			})
			
			let dir_image = dir +"/"+ i +".png"
			const options = {
				url: image.url.split('?')[0],
				dest: dir_image
			}
			
			console.log(i)
			
			await downloadIMG(options)
		}
		
		let json = JSON.stringify(data_result, null, 4)
		fs.writeFileSync(dir +'/data.json', json);
		fs.writeFileSync(dir +'/text.txt', text);
		
		return res.json(data_result)
	})
	
})

app.post('/resizeimg', async (req, res) => {
	let query = req.body.query
	var dir = './files/'+ query;
	let json = require(dir + "/data.json")
	for (let i = 0; i < json.length; i++) {
		let file =  dir +'/'+ i +".png"
		console.log(file)
		let new_file = dir +'/'+ i +"-resizing.png"
		await resizingIMG(file, new_file, i)
	}

	return res.json('success')
})

app.post('/createaudio', async (req, res) => {
	let query = req.body.query
	var dir = './files/'+ query;
	let text = fs.readFileSync(dir + "/text.txt").toString()
	let path = dir +"/audio.wav"
	let json = require(dir +"/data.json")
	
	await create_audio(text, path)
	
	let data = []
	for (let i = 0; i < json.length; i++) {
		let time = await time_elapsed_speech(json[i].sentence)
		time = time.toFixed(2)
		let result = {
			sentence: {
				sentence: json[i].sentence,
				time: time
			},
			split: json[i].split,
			image: json[i].image,
			question: json[i].question,
		}
		data.push(result)
	}
	
	let new_json = JSON.stringify(data, null, 4)
	fs.writeFileSync(dir +'/data-complete.json', new_json);
	
	return res.json('success')
})

app.post('/createvideo', async (req, res) => {
	let query = req.body.query
	var dir = './files/'+ query;
	let json = require(dir +"/data-complete.json")
	
	let images = []
	let time = 0
	for (let i = 0; i < 2; i++) {
		let dir_image = dir +"/"+ i +"-resizing.png"
		images.push({
			path: dir_image,
			caption: json[i].sentence.sentence,
			loop: parseFloat(json[i].sentence.time)
		})
		time = time + parseFloat(json[i].sentence.time)
	}
	
	console.log(images)
	var videoOptions = {
		fps: 25,
		videoBitrate: 1024,
		transition: false,
		videoCodec: 'libx264',
		size: '640x?',
		audioBitrate: '128k',
		audioChannels: 2,
		format: 'mp4',
		pixelFormat: 'yuv420p'
	}
	console.log('continue')
	videoshow(images, videoOptions)
	.audio(dir + '/audio.wav')
	.save(dir+ '/video.mp4')
	.on('start', function (command) {
		console.log('ffmpeg process started:', command)
	})
	.on('error', function (err, stdout, stderr) {
		console.error('Error:', err)
		console.error('ffmpeg stderr:', stderr)
	})
	.on('end', function (output) {
		console.error('Video created in:', output)
		return res.json('success')
	})
})
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
