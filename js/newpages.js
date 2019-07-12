function useTexture(src) {
	var canvas = document.getElementById('myCanvas');
	var img = new Image();
	img.onload = function() {
		if (canvas.getContext) {
			var context = canvas.getContext('2d');
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.drawImage(img, 0, 0, canvas.width, canvas.height);
			canvas.parentNode._x3domNode.invalidateGLObject();
		}
	};
	img.src = src;

}

function mysql2Date(timestamp) {
	//function parses mysql datetime string and returns javascript Date object
	//input has to be in this format: 2007-06-05 15:26:02
	var regex = /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
	var parts = timestamp.replace(regex, "$1 $2 $3 $4 $5 $6").split(' ');
	return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]);
}

function Skin(id, name, img, type, author, license, uploaded, cape_compatible) {
	this.id = Number(id);
	this.name = name;
	this.type = type;
	this.author = author;
	var img = new Image();
	img.className = 'Skin thumb';
	//css klasse zuweisen fuers aussehen ;)
	img.src = "data:" + type + ";base64," + img;
	//das ist die data: url fuer die vorschau
	img.title = name;
	//als titel noch der dateiname.
	/*img.addEventListener('click', function() {
	 useTexture(this.src);
	 }, false);*/
	this.img = img;
	this.license = license;
	this.uploaded = mysql2Date(uploaded);
	this.cape_compatible = (cape_compatible == 1) ? true : false;
};
Skinlist = new Array();
function License(id, name, url, text, imgurl) {
	this.id = id;
	this.name = name;
	this.url = url;
	this.text = text;
	this.imgurl = imgurl;
	this.type = (text == '') ? "url" : "text";
}

function uploadSkin(e) {
	e.preventDefault();
	e.stopPropagation();
	var author = this.author.value;
	var name = this.name.value;
	if (this.license.options[this.license.selectedIndex].defaultSelected) {
		alert("please select a license first!");
		return false;
	}

	var license = this.license.value;
	var img = this.img.value;
	xhr.request(this.action, "author=" + author + "&name=" + name + "&license=" + license + "&img=" + img, uploaded);
	this.submit.disabled = true;
	//this.p.style.display="";
	//console.log(this);

	return false;
}

function checkLicense(input) {
	if (input.options[input.selectedIndex].defaultSelected) {
		input.setCustomValidity('please chose a License from the list');
	} else {
		// input is valid -- reset the error message
		input.setCustomValidity('');
	}
}

function uploaded(http) {
	if (http.status == 200) {

		if (JSON.parse(http.responseText)) {
			var answer = JSON.parse(http.responseText);
			if (answer.success) {
				TINY.box.show({
					html : 'Uploaded successfully!',
					animate : false,
					close : false,
					mask : false,
					boxid : 'success',
					autohide : 3,
					top : -14,
					right : -17
				});
			} else {
				alert("Error: " + answer.status_msg);
			}
		} else {
			alert("Something is wrong: the answer of the server is " + http.getResponseText());
		}

	} else {
		alert("Something is wrong: the answer of the server is " + http.status + " " + http.statusText);
	}

}

function abort() {

	var childNode = this.parentNode;
	childNode.parentNode.removeChild(childNode);
}

/* ==========================================================================
 Drag & drop file handler
 ========================================================================== */

function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var dateien = (this.id == 'skinlist') ? evt.dataTransfer.files : evt.target.files;
	// jenachdem ob ueber drag drop oder durchsuchen ausgewaehlt wurde.
	//in dateien sind jetzt alle dateien gespeichert die ausgewahlt wurden
	for (var i = 0, f; f = dateien[i]; i++) {//alle dateien nacheinander auslesen...
		if (!f.type.match('image.*')) {//fals was anderes als ein bild dabei sein sollte
			alert("ERROR!\n\n could not open the file " + f.name + " as an image");
			continue;
		}

		var reader = new FileReader();

		// wenn die datei geladen ist dann soll die gleich in ein img tag geschrieben werden
		reader.onload = (function(Datei) {
			return function(e) {
				// Vorschau bzw. thumbnail rendern
				var block = document.createElement('div');
				block.className = "option";
				var img = new Image();
				img.className = 'thumb';
				//css klasse zuweisen fuers aussehen ;)
				img.src = e.target.result;
				//das ist die data:// url fuer die vorschau
				img.title = Datei.name;
				//als titel noch der dateiname.
				img.addEventListener('click', function() {
					useTexture(img.src);
				}, false);
				//bild ende
				var form = document.createElement('form');
				form.action = "upload.php";
				form.method = "get";
				form.className = "upload";
				form.addEventListener('submit', uploadSkin, false);
				form.addEventListener('reset', abort, false);
				var titel = document.createElement('label');
				titel.innerHTML = "Name: <input type='text' placeholder='please enter a name' name='name' required><br>";
				//titel Ende
				//var eigenschaften = document.createElement('span');
				var author = document.createElement('label');
				author.innerHTML = "Author: <input type='text' placeholder='enter the name of the Author' name='author' required>";
				var license = document.createElement('label');
				var licenseselect = document.createElement('select');
				licenseselect.addEventListener('change', function(event) {
					event.preventDefault();
					checkLicense(this);
					return false;
				}, true);
				licenseselect.name = "license";
				//var br = document.createElement('br');
				var NeuerEintrag = new Option("Please select your license", "0", true, true);
				licenseselect.options[licenseselect.length] = NeuerEintrag;
				for (index in Licenses) {

					var NeuerEintrag = new Option(Licenses[index].name, Licenses[index].id, false, false);
					licenseselect.options[licenseselect.length] = NeuerEintrag;

				}
				license.innerHTML += "License: ";
				license.insertBefore(licenseselect, null);

				licenseHelp = document.createElement('a');
				licenseHelp.href = getHelpUrl('licenses');
				licenseHelp.addEventListener('click', function(event) {
					event.preventDefault();
					showHelp('licenses');
					return false;
				}, true);
				licenseHelp.className = "actionlink";
				licenseHelp.innerHTML = "help";

				var mimeElem = document.createElement('label');
				var className = (Datei.type == "image/png") ? "valid" : "invalid";
				var toolTip = (Datei.type == "image/png") ? "image is a png file, good :)" : "the selected image is not a png file and not supported by minetest";
				mimeElem.innerHTML = "Mime Type: <input title='" + toolTip + "' class='" + className + "' value='" + Datei.type + "' disabled>";

				var sizeElem = document.createElement('label');
				var size = Datei.size / 1024;

				size = size.toFixed(2);
				var className = (size <= 5) ? "valid" : "invalid";
				sizeElem.innerHTML += "Size: <input class=" + className + " value='" + size + " Kb' disabled>";

				var resolutionElem = document.createElement('label');
				var width = img.width;
				var height = img.height;
				var className = (width == 64 && height == 32) ? "valid" : "invalid";
				resolutionElem.innerHTML += "Resolution: <input class=" + className + " value='" + width + "px x " + height + "px' disabled>";

				var imgElem = document.createElement('input');
				imgElem.name = 'img';
				imgElem.type = "hidden";
				imgElem.value = img.src;

				var submitButtons = document.createElement('div');
				submitButtons.innerHTML = "<progress name='p' style='display:none;'></progress><button type='submit' name='submit' class='addimg'>Upload!</button><button type='reset' class='abort'>discard!</button>";
				//Eigenschaften ende
				block.insertBefore(img, null);
				//das bild ins div schieben.
				form.insertBefore(titel, null);
				//titel einfügen

				form.insertBefore(author, null);
				form.insertBefore(document.createElement('br'), null);
				form.insertBefore(license, null);
				form.insertBefore(licenseHelp, null);
				form.insertBefore(document.createElement('br'), null);
				form.insertBefore(sizeElem, null);
				form.insertBefore(document.createElement('br'), null);
				form.insertBefore(mimeElem, null);
				form.insertBefore(document.createElement('br'), null);
				//form.insertBefore(resolutionElem, null);
				form.insertBefore(document.createElement('br'), null);
				form.insertBefore(imgElem, null);
				//form.insertBefore(document.createElement('br'), null);
				form.insertBefore(submitButtons, null);
				block.insertBefore(form, null);
				//zu guter letzt die Eigenschaften
				document.getElementById('skinlist').insertBefore(block, document.getElementById("dnd"));
				//anschliessend den block einfuegen
				checkLicense(licenseselect);
			};
		})(f);

		reader.readAsDataURL(f);

	}
}

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
}

function initDragDrop() {
	// Event listener Eintragen
	var dropZone = document.getElementById('skinlist');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);
	document.getElementById('files').addEventListener('change', handleFileSelect, false);
}

document.addEventListener('DOMContentLoaded', initDragDrop, false);

/* ==========================================================================
 load skins and write them
 ========================================================================== */

function clearList() {
	//copy = document.getElementById('dnd').outerHTML;
	document.getElementById('skinlist').innerHTML = "";
}

function getSkins(page, get) {
	//copy = document.getElementById('dnd').outerHTML;
	//document.getElementById('skinlist').innerHTML = copy + "<b>Loading. Please wait...</b>";
	var pageElem = document.createElement('div');
	pageElem.id = "page_" + page;
	pageElem.dataset.page = page;
	pageElem.innerHTML = "Page " + page;
	pageElem.className = "page";
	var nextPage = "page_" + Number(Number(page) + 1);
	var prevPage = "page_" + Number(page - 1);
	console.log(nextPage);
	console.log(prevPage);
	if (document.getElementById(pageElem.id) != null) {
		console.log("Seite existiert bereits. leere liste...");
		clearList();
		document.getElementById('skinlist').appendChild(pageElem);
	} else if (document.getElementById(nextPage) != null) {
		console.log("höhere seite gefunden füge vor dießer seite ein");
		document.getElementById('skinlist').insertBefore(pageElem, document.getElementById(nextPage));
	} else if (document.getElementById(prevPage) != null) {
		console.log("niedere seite gefunden füge nach dießer seite ein");
		document.getElementById('skinlist').appendChild(pageElem, document.getElementById(prevPage));
	} else {
		console.log("keine seite gefunden füge seite irgendwo ein");
		document.getElementById('skinlist').insertBefore(pageElem, null);
	}
	var get = location.hash.split("#");
	xhr.request("getskins.php", get[1], gotSkins);

}

config = {};
config.list2dprev = true;
function gotSkins(http) {
	if (http.status == 200) {

		if (JSON.parse(http.responseText)) {
			var answer = JSON.parse(http.responseText);
			if (answer.success) {
				//clearList();
				var elem = document.getElementById("page");
				for (var i = 1; i <= answer.pages; i++) {

					var option = new Option(i, i);

					elem.options[i - 1] = option;
				}
				document.getElementById("max_pages").value = answer.pages;
				elem.selectedIndex = answer.page - 1;
				var i = 0;
				while (answer.data[i]) {
					var skin = answer.data[i];
					var license = Licenses[skin.license_id];
					Skinlist[Number(skin.id)] = new Skin(skin.id, skin.name, skin.img, skin.type, skin.author, license, skin.uploaded, skin.cape_compatible);
					var block = document.createElement('div');
					block.className = "option";
					var img = new Image();
					if (config.list2dprev) {
						img.className = 'list2d';
						//css klasse zuweisen fuers aussehen ;)
						img.src = "./skins/1/" + skin.id + ".png";
						//das ist die data: url fuer die vorschau
						img.title = answer.data[i].name;
						//als titel noch der dateiname.
						block.dataset.img = "data:" + skin.type + ";base64," + skin.img;
						block.addEventListener('click', function() {
							useTexture(this.dataset.img);
						}, false);
					} else {
						img.className = 'thumb';
						//css klasse zuweisen fuers aussehen ;)
						img.src = "data:" + skin.type + ";base64," + skin.img;
						//das ist die data: url fuer die vorschau
						img.title = answer.data[i].name;
						//als titel noch der dateiname.
						img.addEventListener('click', function() {
							useTexture(this.src);
						}, false);
					}
					//bild ende

					var titel = document.createElement('span');
					titel.innerHTML = "Name: <a href='#!page:1,filtertype:Name,filter:" + answer.data[i].name + "'>" + answer.data[i].name + "</a><br>";
					titel.className = "autor";
					//titel Ende
					var eigenschaften = document.createElement('span');
					eigenschaften.innerHTML = "<span class='rightbuttons'><button onclick='download(" + answer.data[i].id + ")' class='download'>&nbsp;Download</button> " + "<button onclick='shareSkin.show(" + answer.data[i].id + ")' class='permalink'>&nbsp;Share</button>" + "<button onclick='report(" + answer.data[i].id + ")' class='report'>&nbsp;Report</button></span> <br>" + "Author: <a href='#!page:1,filtertype:Author,filter:" + answer.data[i].author + "'>" + answer.data[i].author + "</a> <br>" + "License: <a href='#!page:1,filtertype:License,filter:" + answer.data[i].license + "'>" + answer.data[i].license + "</a> &nbsp;" + "<a href='" + getLicenseById(answer.data[i].license_id).url + "' onclick='showLicenseInfo(" + answer.data[i].license_id + ");return false;'><img src=" + getLicenseById(answer.data[i].license_id).imgurl + "></a> <br>" + "Uploaded at: " + dateFormat(answer.data[i].uploaded) + "<br>";
					var warning = document.createElement('span');
					if (Skinlist[Number(skin.id)].cape_compatible == false) {//if the skin is not compatible
						block.className += " invalid";
						warning.className = "warning";
						warning.innerHTML = "This skin is maybe not compatible with the upcomming minetest 0.4.10 <a class='actionlink' href='/helpfiles/cape_compatible.html' onclick='showHelp(\"cape_compatible\");return false;'>What does this message mean</a>";
					}

					//Eigenschaften ende
					block.insertBefore(img, null);
					//das bild ins div schieben.
					block.insertBefore(titel, null);
					block.insertBefore(eigenschaften, null);
					//zu guter letzt die Eigenschaften
					block.insertBefore(warning, null);

					document.getElementById("page_" + answer.page).appendChild(block);
					//anschliesend den block einfuegen
					i++;
				}

				if (answer.data.length < 1) {
					alert("nothing found matching your filter!");
				} else {
					useTexture("data:" + answer.data[0].type + ";base64," + answer.data[0].img);
				}
			} else {
				TINY.box.show({
					html : '<h1>oops :/</h1> <h2>an error happend! </h2><u><b>Errmsg:</b></u><pre>' + answer.status_msg + '</pre><br><b>you may can try it again,but if you still get this mesage than you should report the bug at the <a href="https://project.king-arthur.eu/projects/minetest-skin-db" >project page</a> or at the <a href="https://forum.minetest.net/viewtopic.php?id=4497">minetest forum thread</a>',
					animate : false,
					close : true,
					boxid : 'error'
				});
			}

		} else {
			alert("Something is wrong: the status of http is: " + http.getResponseText());
		}

	} else {
		alert("Something is wrong: the answer of the server is " + http.status + " " + http.statusText);
	}
	global_laden = false;
}

//document.addEventListener("DOMContentLoaded", function(){ getSkins(1) }, false);

/* ==========================================================================
 read the anchor
 ========================================================================== */
/**
 * Copyright 2009 by David Kerkeslager
 * Released under the BSD License (http://davidkerkeslager.com/license.txt).
 *
 * This library defines an object-literal which allows one to store key/value pairs after the hash (#) in the URI.
 * The syntax of the storage is modeled after the way that GET variables are stored after the question mark (?) in
 * the URI.
 *
 * Example URI: "http://www.foo.com/index.html#foo=bar&baz=quux"
 *
 * Note: it should be obvious that this should not be used for storing private data of any kind.
 */

var URIHash =
{
	/**
	 * Dump the contents of the URI hash into an associative array. If the hash is invalid, the method returns
	 * undefined.
	 */
	dump : function()
	{
		var hash = document.location.hash;
		var dump = new Array();

		if(hash.length == 0) return dump;

		hash = hash.substring(1).split('&');

		for(var key in hash)
		{
			var pair = hash[key].split('=');

			if(pair.length != 2 || pair[0] in dump)
				return undefined;

			// escape for storage
			dump[unescape(pair[0])] = unescape(pair[1]);
		}

		return dump;
	},

	/**
	 * Takes an associative array and stores it in the URI as a hash after the # prefix, replacing any pre-
	 * existing hash.
	 */
	load : function(array)
	{
		var first = true;
		var hash = '';

		for(var key in array)
		{
			if(!first) hash += '&';
			hash += escape(key) + '=' + escape(array[key]);
			first = false;
		}

		document.location.hash = hash;
	},

	/**
	 * Get the value of a key from the hash.  If the hash does not contain the key or the hash is invalid,
	 * the function returns the default.
	 */
	get : function(key,_default)
	{
		return (this.dump()[key]) ? this.dump()[key] : _default;
	},

	/**
	 * Set the value of a key in the hash.  If the key does not exist, the key/value pair is added.
	 */
	set : function(key,value)
	{
		var dump = this.dump();
		dump[key] = value;

		var hash = new Array();

		for(var key in dump)
			hash.push(escape(key) + '=' + escape(dump[key]));

		document.location.hash = hash.join('&');
	}
};

var oldhash = null;
function anchor() {
	var newhash = location.hash;
	if (oldhash != newhash) {
		
		oldhash = newhash;
		//URIHash.load();
		getSkins(URIHash.get('page','1'));
	};
	checkAnchor = setTimeout(anchor, 500);
};

document.addEventListener("DOMContentLoaded", anchor, false);
/** ==========================================================================
 Function to show hide the filter
 param 1 = bool show 
 if true then show
 if false then hide
 if undefined or something other toggle;

 ========================================================================== */
function showfilter(show){
	var filterelem = document.getElementById("advancedfilter");
	if(show == true){
		filterelem.style.width = "300px";
	}
	else if (show == false){
		filterelem.style.width = "0px";
	}
	
	else{
		if(filterelem.style.width == "300px")
		filterelem.style.width = "0px";
		else filterelem.style.width = "300px";
	}
	
}
/**
 * this function is caled when the filter changes
 */
function changeFilter(form){
	var ids = form.ids.value;
	var name = form.name.value;
	var author = form.author.value;
	var license = form.license.value;
	var load = new Array();
	if(ids !="") load.id = ids;
	if(name !="") load.name = name;
	if(author !="") load.author = author;
	if(license !="") load.license = license;
	URIHash.load(load);
}
	
/* ==========================================================================
 skinlist buttons
 ========================================================================== */

function download(id) {
	window.open('/download.php?id=' + id, '_blank');
}

function permalink(id) {
	var html = "this is your permamentlink to the skin file. just copy it and share it with other people.<br>" + "<pre>" + location.protocol + "//" + location.hostname + location.pathname + "#!page:1,filtertype:Id,filter:" + id;
	TINY.box.show({
		html : html
	});
}

function report(id) {

	TINY.box.show({
		url : "reportSkin.php",
		post : "id=" + id
	});
}

function submitReport(form) {

	TINY.box.fill("reportSkin.php", 1, "id=" + form.id.value + "&text=" + form.text.value + "&topic=" + form.topic.value);
	return false;
}

function resetReport(form) {
	TINY.box.hide();
	return false;
}

/* ==========================================================================
 toolbar functions
 ========================================================================== */

function resetView() {
	document.getElementById('x3dprev').runtime.resetView();
}

function getScreenshot() {
	screenshot = document.getElementById('x3dprev').runtime.getScreenshot();
	window.open(screenshot, '_blank', "width=512,height=512");
}

function dateFormat(mysqldate) {
	var date = Date.createFromMysql(mysqldate);
	//console.debug(date);
	return mysqldate;
	//todo! shuld output something like "just now" or "today at 17:30" or "12.12.12"
}

function goPage(page) {
	if (Number(page) >= 1) {
		URIHash.set('page', page);
	}

}

Date.createFromMysql = function(mysql_string) {
	if ( typeof mysql_string === 'string') {
		var t = mysql_string.split(/[- :]/);

		//when t[3], t[4] and t[5] are missing they defaults to zero
		return new Date(t[0], t[1] - 1, t[2], t[3] || 0, t[4] || 0, t[5] || 0);
	}

	return null;
};

/* ==========================================================================
 licenses functions
 ========================================================================== */
var Licenses = new Array();
function getLicenses() {
	var HTTP = new XMLHttpRequest();
	HTTP.open("POST", "api/get.json.php?licenses", false);
	HTTP.onreadystatechange = function() {
		//console.log(HTTP.readyState);
		console.log("get licenses " + (20 * (HTTP.readyState + 1)) + "% loaded");
		if (HTTP.readyState == 4) {
			var objekt = JSON.parse(HTTP.responseText).licenses;
			var i = 0;
			while (objekt[i]) {
				Licenses[objekt[i].id] = new License(objekt[i].id, objekt[i].name, objekt[i].url, objekt[i].text, objekt[i].imgurl);
				i++;
			}
		} else {

		}
	};
	HTTP.send(null);
}

function getLicenseById(id) {
	for (var element in Licenses) {
		if (Licenses[element].id == id)
			return Licenses[element];
	}
	return undefined;
}

function showLicenseInfo(id) {
	var license = getLicenseById(id);
	if (license.type == "url") {
		TINY.box.show({
			iframe : license.url,
			boxid : 'frameless',
			width : 900,
			height : 600,
			fixed : false,
			maskid : 'bluemask',
			maskopacity : 40
		});
	} else {
		TINY.box.show({
			html : license.text,
			boxid : 'frameless',
			width : 750,
			height : 450,
			fixed : false,
			maskid : 'bluemask',
			maskopacity : 40
		});
	}
}

function getHelpUrl(about) {
	return "/helpfiles/" + about + ".html";

}

function showHelp(about) {
	TINY.box.show({
		iframe : getHelpUrl(about),
		boxid : 'frameless',
		width : 800,
		height : 600,
		fixed : false,
		maskid : 'bluemask',
		maskopacity : 40
	});

}

getLicenses();

shareSkin = {
	modified : function(elem) {
		var path = "http://" + location.hostname + location.pathname;
		var selected = elem.value;
		var form = elem.form;
		var id = form.id.value;
		form.help.value = elem.selectedOptions[0].title;
		if (selected == "perma") {
			form.output.value = path + "#!page:1,filtertype:Id,filter:" + id;
		} else if (selected == "forum") {
			var license = Skinlist[id].license;
			form.output.value = "[u]name[/u]:" + Skinlist[id].name + "\n" + "[img]" + path + "skins/5/" + id + ".png[/img]\n" + "[u]author[/u]: " + Skinlist[id].author + "\n" + "[u]license[/u]:[url=" + license.url + "]" + license.name + "[img]" + license.imgurl + "[/img][/url]\n" + "[b][url=" + path + "#!page:1,filtertype:Id,filter:" + id + "]view in 3d![/url] on skin Database\n[/b]" + "[b][url=" + path + "download.php?id=" + id + "]Download[/url][/b]";
		}
		console.debug(form);
	},
	show : function(id) {
		TINY.box.show({
			url : "shareSkin.php",
			post : "id=" + id
		});
	}
};

//settings window
settings = {};
settings.showHide = function() {
	if (document.getElementById('settingsWindow').style.display == 'block') {
		document.getElementById('settingsWindow').style.display = 'none';
		//document.getElementById('showHide').innerHTML = 'Show description';
	} else {
		document.getElementById('settingsWindow').style.display = 'block';
		//document.getElementById('showHide').innerHTML = 'Hide description';
	}
};
function toggle(elemId) {
	if (document.getElementById(elemId).style.display == 'block') {
		document.getElementById(elemId).style.display = 'none';
	} else {
		document.getElementById(elemId).style.display = 'block';
	}
};

function vollbild() {

	var element = document.getElementsByTagName("body")[0];

	if (element.requestFullScreen) {

		if (!document.fullScreen) {
			element.requestFullscreen();
		} else {
			document.exitFullScreen();
		}

	} else if (element.mozRequestFullScreen) {

		if (!document.mozFullScreen) {
			element.mozRequestFullScreen();
		} else {
			document.mozCancelFullScreen();
		}

	} else if (element.webkitRequestFullScreen) {

		if (!document.webkitIsFullScreen) {
			element.webkitRequestFullScreen();
		} else {
			document.webkitCancelFullScreen();
		}

	}

}

var global_scrolldiff = 400;
var global_laden = false;
function nextElements() {
	var element = document.getElementById('skinlist');
	var height = element.scrollTopMax;
	var scroll = element.scrollTop;
	var diff = height - scroll;
			var max_pages = Number(document.getElementById('max_pages').value);

	if (diff <= global_scrolldiff && global_laden == false) {
		var page = Number(element.lastElementChild.dataset.page);
		if (page >= max_pages)
			return;
		global_laden = true;
		console.log("runtergescrollt zu " + diff);


		console.log(page + 1);
		goPage(page + 1);
	} else if (element.scrollTopMax - diff <= global_scrolldiff && global_laden == false) {
		var page = Number(element.firstElementChild.dataset.page);
		if (page <= 1)
			return;
		global_laden = true;
		console.log("hochgescrollt zu " + diff);

		console.log(page - 1);
		goPage(page - 1);
	}
} 