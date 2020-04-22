var say = require("say");
var fs = require("fs");
var filename = './files/History_of_Indonesia/myaudio.wav';
// var json = fs.readFileSync("./example_response.json")
// json = JSON.parse(json)
var dir = './files/History_of_Indonesia';

var json = require("./example_response.json")

// say.export("I'm sorry, Dave.", 'Samantha', 1, filename, function(err) {
//     if (err) {
//         return console.error(err);
//     }

//     console.log(`Text has been saved to ${filename}`);
// });

var now = require("performance-now")
async function measurePerformance() { 
    let data = await delaying(); 
    console.log("Function took " + data + " milliseconds"); 
} 

async function delaying(text) {
    let start = now(); 
    return new Promise((resolve, reject) => {
        say.speak(text, 'Samantha', 4, (err) => {
            let timeElapsed = (now() - start) > 1 ? Math.round((now() - start) / 1000) : Math.ceil((now() - start) / 1000)
            if (err) {
                return console.error(err)
            }
            return resolve(timeElapsed)
        });
    })
}

function createMp3(text) {
    // return new Promise((resolve, reject) => {
    say.export(text, 'Samantha', 0.9, filename, (err) => {
        if (err) {
            return console.error(err)
        }
        console.log('Exported mp3')
    })
}

async function loop(text) {
    return new Promise((resolve, reject) => {
        let data = []
        for (let i = 0; i < json.length; i++) {
            let sentence = []
            for (let j = 0; j < json[i].sentence.length; j++) {
                sentence.push({
                    sentence: json[i].sentence[j],
                    // time: await delaying(json[i].sentence[j])
                })
            }
            
            data.push(sentence)
        }
        
        resolve(data)
    })
}

(async () => {
    var dir = './files/History_of_Indonesia';
    
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    
    let text = ''
    for (let i = 0; i < json.length; i++) {
        for (let j = 0; j < json[i].sentence.length; j++) {
            text += json[i].sentence[j]
        }
    }
    await createMp3(text)
    
    let data = []
    for (let i = 1; i < 2; i++) {
        let sentence = []
        for (let j = 0; j < json[i].sentence.length; j++) {
            let time = await delaying(json[i].sentence[j])
            console.log(time)
            sentence.push({
                sentence: json[i].sentence[j],
                time: time > 1 ? time * 4 : 1
            })
        }
        let result = {
            sentence: sentence,
            split: json[i].split,
            image: json[i].image,
            question: json[i].question,
        }
        data.push(result)
    }
    
    data = JSON.stringify(data, null, 4)
    fs.writeFileSync(dir +'/data.json', data);
    console.log(data)
})()