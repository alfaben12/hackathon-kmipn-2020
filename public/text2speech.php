<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Text to Speech</title>
<script src="https://code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script>
<style>
.container{
	width: 100%;
	height: 600px;
}
img{
	width:100%; 
	height:100%; 
	object-fit:contain; 
}
.centered {
	position: absolute;
	top: 80%;
	left: 50%;
	font-size: 25px;
	transform: translate(-50%, -50%);
}
</style>
</head>
<body style="background-color:#919191">
<div class="container">
<img src="">
<font class="centered"></font>
</div>
</body>
<script>
$.ajax({
	url: 'http://localhost:3000/',
	type: 'POST',
	dataType: 'json',
	cache: false,
	beforeSend: function() {},
	success: async function(response) {
		let all_text = ''
		// response.map(function(data){
			for (let i = 0; i < response.length; i++) {
				// text2speech(data.sentence, data.image)
				$("img").attr("src", response[i].image.url)
				
				for (let j = 0; j < response[i].sentence.length; j++) {
					$("font").text(response[i].sentence[j])
					
					var msg = new SpeechSynthesisUtterance(response[i].sentence[j]);
					var voices = window.speechSynthesis.getVoices();
					msg.voice = voices[32];
					// msg.voice = voices[6];
					msg.rate = 1;
					window.speechSynthesis.speak(msg);
					
					function delaying() {
						return new Promise(function(res) {
							msg.onend = function(event) {
								return res(event.elapsedTime)
							}
						})
					}
					await delaying() // delaying
				}
				continue
			}
			// })
		}
	})
	
	function timer(ms) {
		return new Promise(res => setTimeout(res, ms));
	}
	
	function text2speech(text, img){
		$("img").attr("src", data.image)
		$("font").text(data.sentence)
		
		var msg = new SpeechSynthesisUtterance(text);
		var voices = window.speechSynthesis.getVoices();
		msg.voice = voices[32];
		msg.rate = 1;
		window.speechSynthesis.speak(msg);
		
		msg.onend = function(event) {
			
		}
	}
	</script>

	<!-- <script>
		var msg = new SpeechSynthesisUtterance('Hello word, my name is alex brant, i live in liverpool, england.');
		var voices = window.speechSynthesis.getVoices();
		console.log(voices)
		msg.voice = voices[32];
		msg.rate = 1;
		window.speechSynthesis.speak(msg);
		
		msg.onend = function(event) {
			console.log(event.elapsedTime)
		}
	</script> -->
	</html>