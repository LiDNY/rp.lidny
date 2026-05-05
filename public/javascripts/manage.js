var editmap;
var marker;

var extractMainLocation = function(location) {
	if (!location) {
		return false;
	}
	if (location.indexOf("-") > 0) {
		location = location.substring(0, location.indexOf("-"));
	}
	if (location.indexOf(",") > 0) {
		location = location.substring(0, location.indexOf(","));
	}
	return location;
};


var positionMap = function(location, country) {
	var zoom = 5;
	var addr = false;
	if (location && country) {
		addr = extractMainLocation(location) + ", " + country;
		zoom = 14;
	} else if (location) {
		addr = extractMainLocation(location);
		zoom = 12;
	} else if (country) {
		addr = extractMainLocation(country);
		zoom = 5;
	}
	if (addr) {
        fetch("https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(addr))
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    editmap.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], zoom);
                }
            })
            .catch(err => console.error(err));
	} else {
		editmap.setView([47, 8], 6);
	}
};


var updateMap = function() {
	var latitude = $('#lat').val();
	var longitude = $('#lng').val();
	if (latitude && longitude) {
		return;
	}
	var location = $("select[name=location]").val() > 0 ? $("select[name=location] option:selected").text() : false;
	var country = $("select[name=country]").val() > 0 ? $("select[name=country] option:selected").text() : false;
	positionMap(location, country);
};

$(document).ready(function() {
	// initialize map
	editmap = L.map('editmap');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(editmap);

	editmap.on('click', function(event) {
		if (marker) {
			marker.setLatLng(event.latlng);
		} else {
			marker = L.marker(event.latlng, { draggable: true }).addTo(editmap);
            marker.on('dragend', function(e) {
                $('#lat').val(e.target.getLatLng().lat);
                $('#lng').val(e.target.getLatLng().lng);
            });
		}
		$('#lat').val(event.latlng.lat);
		$('#lng').val(event.latlng.lng)
	});

	// set marker to correct starting position
	var latitude = $('#lat').val();
	var longitude = $('#lng').val();
	if (latitude && longitude) {
		marker = L.marker([latitude, longitude], { draggable: true }).addTo(editmap);
        marker.on('dragend', function(e) {
            $('#lat').val(e.target.getLatLng().lat);
            $('#lng').val(e.target.getLatLng().lng);
        });
		editmap.setView([latitude, longitude], 18);
	} else {
		updateMap();
	}

	// respond to changes of contry and location
	$("select[name=location]").change(updateMap);
	$("select[name=country]").change(updateMap);

	// fetch location suggestions
	$.get(window.location.href.split('?')[0] + "/_suggest_locations", function(data) {
		if (data.length == 0) {
			return false;
		}
		var target = $("<small/>").attr("style", "text-align: right; display: block; margin-top: -7px;");
		$("label[for=newLocation]").append(target);
		target.append(txtSuggestions + ":<br/>");
		for (var i = 0; i < data.length; ++i) {
			var suggestion = data[i];
			var content;
			if (suggestion.numId) {
				content = $("<a/>").attr("href", "javascript:void(0)").attr("data-id", suggestion.numId).text(suggestion.name).click(function(){
					$("select[name=location]").val($(this).data("id"));
				});
			} else {
				content = suggestion.name;
			}
			target.append(content);
			target.append($("<br/>"));
		}
		return false;
	});
	
	// fetch train suggestions
	$.get(window.location.href.split('?')[0] + "/_suggest_trains", function(data) {
		if (data.length == 0) {
			return false;
		}
		var target = $("<small/>").attr("style", "display: block;");
		target.append(txtSuggestions + ":<br />");
		for (var i = 0; i < data.length; ++i) {
			content = $("<a/>").attr("href", "javascript:void(0)").text(data[i]).click(function(){
				$("textarea[name=description]").val($(this).text());
			});
			target.append(content);
			target.append("<br />");
		}
		$("textarea[name=description]").after(target);
		return false;
	});
});
