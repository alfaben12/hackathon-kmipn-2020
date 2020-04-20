// var videoshow = require('videoshow')
// var path = require('path');
// let ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
// let ffmpeg = require('fluent-ffmpeg')

// ffmpeg.setFfmpegPath(ffmpegPath)

// var images = [
//   'http://localhost:5000/fixtures/step_1.png',
//   'http://localhost:5000/fixtures/step_2.png',
//   'http://localhost:5000/fixtures/step_3.png',
//   'http://localhost:5000/fixtures/step_4.png'
// ]

// var videoOptions = {
//   fps: 25,
//   loop: 5, // seconds
//   transition: true,
//   transitionDuration: 1, // seconds
//   videoBitrate: 1024,
//   videoCodec: 'libx264',
//   size: '640x?',
//   audioBitrate: '128k',
//   audioChannels: 2,
//   format: 'mp4',
//   pixelFormat: 'yuv420p'
// }

// videoshow(images, videoOptions)
//   .audio('http://localhost:5000/fixtures/song.mp3')
//   .save('video.mp4')
//   .on('start', function (command) {
//     console.log('ffmpeg process started:', command)
//   })
//   .on('error', function (err, stdout, stderr) {
//     console.error('Error:', err)
//     console.error('ffmpeg stderr:', stderr)
//   })
//   .on('end', function (output) {
//     console.error('Video created in:', output)
//   })