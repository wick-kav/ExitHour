var calculateExitTime = function(){
	var targetTime = document.getElementById('time').value+':00.0';
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {targetTime: targetTime}, function(response) {
			document.getElementById('textTargetTime').textContent='Orario di uscita: ' + JSON.stringify(response.targetTime);
		});
	});
}
document.getElementById('calculateButton').onclick = calculateExitTime;

