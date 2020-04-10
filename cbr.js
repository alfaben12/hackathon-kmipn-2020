
const express = require('express')
const app = express()
const port = 3000
const fs = require('fs');
const neatCsv = require('neat-csv');
var natural = require('natural');
var classifier = new natural.BayesClassifier();

app.use(express.json({limit: '50mb', extended: true}));
app.use(express.urlencoded({ extended: true,limit:'50mb',parameterLimit:500000 }));

var weight = {
	'road' : 1,
	'tire' : 0.75,
	'weather' : 0.5,
	'traffic' : 0.5,
	'machine' : 0.75
};

var road = {
	1 : 'Mulus',
	2 : 'Berpasir',
	3 : 'Berlubang'
};

var tire = {
	1 : 'Baik',
	2 : 'Buruk'
};

var weather = {
	1 : 'Cerah',
	2 : 'Mendung',
	3 : 'Hujan'
};

var traffic = {
	1: 'Hijau',
	2: 'Kuning',
	3: 'Merah'
}

var machine = {
	1: 'Baik',
	2: 'Buruk'
}

var road_rel = {
	1 : {
		1 : 1,
		2 : 0.25,
		3 : 0.25
	},
	2 : {
		1 : 0.25,
		2 : 1,
		3 : 0.5
	},
	3 : {
		1 : 0.25,
		2 : 0.5,
		3 : 1
	}
};

var tire_rel = {
	1 : {
		1 : 1,
		2 : 0.5
	},
	2 : {
		1 : 0.5,
		2 : 1
	}
};

var weather_rel = {
	1 : {
		1 : 1,
		2 : 0.75,
		3 : 0.25
	},
	2 : {
		1 : 0.75,
		2 : 1,
		3 : 0.75
	},
	3 : {
		1 : 0.25,
		2 : 0.75,
		3 : 1
	}
};

var traffic_rel = {
	1 : {
		1 : 1,
		2 : 0.75,
		3 : 0.25
	},
	2 : {
		1 : 0.75,
		2 : 1,
		3 : 0.75
	},
	3 : {
		1 : 0.25,
		2 : 0.75,
		3 : 1
	}
};

var machine_rel = {
	1 : {
		1 : 1,
		2 : 0.5
	},
	2 : {
		1 : 0.5,
		2 : 1
	}
};

var solution = {
	1 : 'Kecepatan max 30km/jam',
	2 : 'Kecepatan max 60km/jam',
	3 : 'Kecepatan max 90km/jam',
	4 : 'Kecepatan max 120km/jam'
};


function get_detail(name, id){
	return eval(name)[id];
}

function get_rel(name, id1, id2) {
	let rel_name = name+ '_rel';
	return eval(rel_name)[id1][id2];
}

async function read_record(){
	let filepath = process.cwd()+ '/dataset.kmipn2020'
	let data_fs = fs.readFileSync(filepath)
	let result = neatCsv(data_fs)
	return result
}

async function solve(road_param, tire_param, weather_param, traffic_param, machine_param) {
	let result = [];
	// all previous data
	let data = await read_record();
	// search available solution
	for (let i = 0; i < data.length; i++) {
		let name = data[i].name
		let road = data[i].road //1
		let tire = data[i].tire //2
		let weather = data[i].weather //3
		let traffic = data[i].traffic //4
		let machine = data[i].machine //5
		let solutionid = data[i].solutionid //6
		
		// if it happened in a record
		let result = []
		if(road == road_param &&tire == tire_param && weather == weather_param && traffic == traffic_param && machine == machine_param) {
			// return the solution
			result['status'] = 'old';
			result['message'] = 'Solusi ditemukan dari kasus lama no <span class="red">'+i+'</span>';
			result['solution'] = {
				'id': solutionid,
				'value': get_detail('solution', solutionid)
			};
			return result;
		}
	}
	
	// generate new solution
	let all_solution = [];
	let solution = 0;
	let temp_w = 0;
	
	for (let i = 0; i < data.length; i++) {
		let name = data[i].name
		let road = data[i].road //1
		let tire = data[i].tire //2
		let weather = data[i].weather //3
		let traffic = data[i].traffic //4
		let machine = data[i].machine //5
		let solutionid = data[i].solutionid //6
		// calculate each record
		let w = ((eval(weight)['road'] * get_rel('road', road, road_param))
		+ (eval(weight)['tire'] * get_rel('tire', tire, tire_param))
		+ (eval(weight)['weather'] * get_rel('weather', weather, weather_param))
		+ (eval(weight)['traffic'] * get_rel('traffic', traffic, traffic_param))
		+ (eval(weight)['machine'] * get_rel('machine', machine, machine_param)))
		/ (eval(weight)['road'] + eval(weight)['tire'] + eval(weight)['weather'] + eval(weight)['traffic'] + eval(weight)['machine']
		);
		if(w > temp_w) {
			temp_w = w;
			solution = {
				'id': solutionid,
				'value': get_detail('solution', solutionid)
			}
		}
		all_solution[i] = {
			id:i,
			weight: w.toFixed(3)};
		}
		// sort in reverse order
		// arsort($all_solution);
		result['status'] = 'new';
		result['message'] = 'Solusi dibentuk untuk ';
		result['message'] += ''+get_detail('road', road_param)+',';
		result['message'] += ''+get_detail('tire', tire_param)+',';
		result['message'] += ''+get_detail('weather', weather_param)+',';
		result['message'] += ''+get_detail('traffic', traffic_param)+',';
		result['message'] += ''+get_detail('machine', machine_param)+',';
		result['message'] += 'dengan hasil :';
		result['all_solution'] = all_solution;
		result['solution'] = solution;
		return result;
	}
	
	function write_new_solution(name, road, tire, weather, traffic, machine, solutionid){
		let filepath = process.cwd()+ '/dataset.kmipn2020'
		return fs.appendFileSync(filepath, "\n"+name+','+road+','+tire+','+weather+','+traffic+','+machine+','+solutionid);
	}
	
	app.post('/', async (req, res) => {
		let name = req.body.name
		let road = req.body.road
		let tire = req.body.tire
		let weather = req.body.weather
		let traffic = req.body.traffic
		let machine = req.body.machine
		
		let csv_value = await read_record()
		let result_solution = await solve(road, tire, weather, traffic, machine);
		write_new_solution(name, road, tire, weather, traffic, machine, await result_solution.solution.id)

		return res.json(result_solution)
	});
	
	app.get('/', (req, res) => {
		classifier.addDocument('i am long qqqq', 'buy');
		classifier.addDocument('buy the q\'s', 'buy');
		classifier.addDocument('short gold', 'sell');
		classifier.addDocument('sell gold', 'sell');
		
		classifier.train();
		console.log(classifier.classify('i am a buyer silver'));
	})
	app.listen(port, () => console.log(`Example app listening on port ${port}!`))