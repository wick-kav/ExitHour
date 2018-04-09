﻿const getPresencesRestService = new RestService("https://srm2.netsitech.com/srmrest/api/presences", "GET");

function RestService (url, method){
	this.url = url;
	this.method = method;
	
	this.getURL = function(){
		return url;
	}
	
	this.getMethod = function(){
		return method;
	}
}

var token = null;
var exitTime = null;

var processPresences = function(data, targetTime) {
	targetTime = hmsToSecondsOnly(targetTime); 	// hh:mm:ss => (hh) * 3600 + mm * 60 + ss
	var secondsPause = 0; 						// durata della pausa in secondi

	data.presences.sort(comparePresences); 		// mi assicuro che la prima presenza dell'array abbia l'orario di entrata
	if(data.presences.length > 0){
		var secondsArrival = hmsToSecondsOnly(data.presences[0].begin);

		// calcolo la durata della pausa
		for (var i = 1; i < data.presences.length; i++) {
			secondsPause += hmsToSecondsOnly(data.presences[i].begin) - hmsToSecondsOnly(data.presences[i - 1].end);
		}

		var secondsExitHour = secondsArrival + targetTime + secondsPause; // Es: 08:30:00 + 08:00:00 + 00:30:00 = 17:00:00
		var exitHour = new Date(null);
		exitHour.setSeconds(secondsExitHour);
		exitTime = exitHour.toISOString().substr(11, 8); // hh:mm:ss
	}
}

function comparePresences(a, b) {
	return (a && b && a.begin && b.begin) ? a.begin.localeCompare(b.begin) : 1;
}

function isCheckSecurityTokenCreated(){
	if(token == null){
		retrieveSecurityToken();
	}
	return token == null ? false : true;
}

function retrieveSecurityToken(){
	var data = sessionStorage.getItem('userContext');
	data = JSON.parse(data);
	if (data && data.srmToken) {
		token = data.srmToken;
		return token;
	}
}

function retrievePresencesInfo(targetTime) {
	if(!token){
		retrieveSecurityToken();
	}
	$.ajax({
		url : getPresencesRestService.getURL(),
		data : {
			date : getTodayStringRepresentation(),
			time : (new Date).getTime()
		},
		type : getPresencesRestService.getMethod(),
		beforeSend : function(xhr) {
			xhr.setRequestHeader('X-SRM-Token', token);
		},
		success : function(data) {
			processPresences(data, targetTime);
		},
		error : function(data) {
			console.log("Errore: " + JSON.stringify(data));
			token = null;
			responseData = null;
		}
	});
}

function hmsToSecondsOnly(str) {
	if (str.includes(" ")) {
		// str : 2014-02-22 08:45:00.0 => 08:45:00.0
		str = str.split(" ")[1];
	}
	str.replace(".0"); // str : 08:45:00.0 => 08:45:00
	var p = str.split(':'), s = 0, m = 1;
	while (p.length > 0) {
		s += m * parseInt(p.pop(), 10);
		m *= 60;
	}
	return s;
}

function getTodayStringRepresentation() {
	var mock = false;
	if(mock){
		return '2018-03-30';
	}else{
		function leftFill(number) {
			return number < 10 ? '0' + number : number;
		}
		var today = new Date();
		return today.getFullYear() + '-' + leftFill(today.getMonth() + 1) + '-' + leftFill(today.getDate()); // format: yyyy-mm-dd
	}
}


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	  if (isCheckSecurityTokenCreated()) {
		  var targetTime = retrievePresencesInfo(request.targetTime);
		  sendResponse({targetTime : exitTime});
	  }else{
		  sendResponse({targetTime : "NA"});
	  }
  });