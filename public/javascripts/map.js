var popup;
var map;
var markers = [];

var showInfoWindow = function ( marker, pictureId, lat, lng ) {
	if ( popup ) {
		popup.remove();
	}
	var moreEncoded = $('<div/>').text(txtMore).html();
	var contentHtml = "<div id=\"maptooltipid\" class=\"maptooltip\"><a href=\""+pictureId+"\" target=\"_blank\"><img src=\"/photos/small/"+pictureId+".jpg\" /></a><br /><br /><a href=\"search?lat="+lat+"&lng="+lng+"\" target=\"_blank\">"+moreEncoded+"...</a></div>";
	popup = L.popup({ offset: [0, -30] }).setLatLng([lat, lng]).setContent(contentHtml).openOn(map);
};

var hideInfoWindow = function () {
	if ( popup ) {
		popup.remove();
	}
};

var init = function() {
    var zoom = parseInt(window.localStorage.getItem('map-zoom'));
    if (isNaN(zoom)) {
        zoom = 3;
    }
    var lat = parseFloat(window.localStorage.getItem('map-lat'));
    var lng = parseFloat(window.localStorage.getItem('map-lng'));
    if (isNaN(lat) || isNaN(lng)) {
        lat = 47;
        lng = 8;
    }

    map = L.map('mapCanvas').setView([lat, lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    map.on('moveend', function() {
        window.localStorage.setItem('map-zoom', map.getZoom());
        window.localStorage.setItem('map-lat', map.getCenter().lat);
        window.localStorage.setItem('map-lng', map.getCenter().lng);
    });

    var markersCluster = L.markerClusterGroup({ maxClusterRadius: 50, disableClusteringAtZoom: 12 });
    markerData.forEach(function(data) {
        var marker = L.marker([data.lat, data.lng]);
        marker.on('click', function() { showInfoWindow(marker, data.photoId, data.lat, data.lng); });
        markersCluster.addLayer(marker);
    });
    map.addLayer(markersCluster);
}

$(document).ready(function() {
    init();
});