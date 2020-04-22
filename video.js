var videoshow = require('videoshow')
var fs = require('fs');
var sharp = require('sharp');
let ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
let ffmpeg = require('fluent-ffmpeg')
var dir = './files/History_of_Indonesia';

var json = fs.readFileSync(dir+ "/data.json")
const download = require('image-downloader')
json = JSON.parse(json)
ffmpeg.setFfmpegPath(ffmpegPath)


// function downloadIMG(options) {
// 	try {
// 		const { filename, image } = download.image(options)
// 		console.log(filename) // => /path/to/dest/image.jpg
// 	} catch (e) {
// 		console.error(e)
// 	}
// }

// for (let i = 0; i < json.length; i++) {
// 	let dir_image = dir +"/"+ i +".png"
// 	const options = {
// 		url: json[i].image.url,
// 		dest: dir_image
// 	}
	
// 	downloadIMG(options)
	
// 	sharp(dir_image).resize({
// 		height: 1080,
// 		width: 1920
// 	}).toFile('/Users/macair4/Documents/Thariq/NODE/hackathon-kmipn-2020/files/History_of_Indonesia/'+i+'-temp.png').then(function(newFileInfo) {
// 		console.log("Image Resized");
// 	}).catch(function(err) {
// 		console.log(err);
// 	});
// }

let images = [
	{
	path: '/Users/macair4/Documents/Thariq/NODE/hackathon-kmipn-2020/img_lights.jpg',
	loop: 1.25
},
{
	path: '/Users/macair4/Documents/Thariq/NODE/hackathon-kmipn-2020/img_lights.jpg',
	loop: 1.25
},
{
	path: '/Users/macair4/Documents/Thariq/NODE/hackathon-kmipn-2020/img_lights.jpg',
	loop: 1.25
}]

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

videoshow(images, videoOptions)
.save('video.mp4')
.on('start', function (command) {
	console.log('ffmpeg process started:', command)
})
.on('error', function (err, stdout, stderr) {
	console.error('Error:', err)
	console.error('ffmpeg stderr:', stderr)
})
.on('end', function (output) {
	console.error('Video created in:', output)
})