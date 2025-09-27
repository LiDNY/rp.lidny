window.addEventListener("DOMContentLoaded", () => {
    const lonlat = window.map_location || [ 0, 0 ];

    class OpenOnControl extends ol.control.Control {
        constructor(opt_options) {
            const options = opt_options || {};
            const element = document.createElement('div');
            element.className = 'ol-unselectable ol-control ol-urls';

            const coords = options.coords || [ 0, 0 ]
            const zoom = options.zoom || 18

            function url(link, name) {
                const url = document.createElement('a');
                url.href = link;
                url.innerText = name;
                url.target = "window"

                element.appendChild(url);
            }

            url('https://www.google.com/maps/@' + coords[1].toString() + ',' + coords[0].toString() + ',' + zoom.toString() + 'z', 'View on Google Maps')
            url('https://www.openstreetmap.org/#map=' + zoom.toString() + '/' + coords[1].toString() + '/' + coords[0].toString(), 'View on OpenStreetMap')

            super({
                element: element,
                target: options.target,
            });
        }
    }

    class LayerToogle extends ol.control.Control {
        constructor(opt_options) {
            const options = opt_options || {};
            const element = document.createElement('div');
            element.className = 'ol-unselectable ol-control ol-toggle';

            const toggle = document.createElement('a');
            toggle.innerText = "Enable " + options.name + " layer";
            element.appendChild(toggle);

            super({
                element: element,
                target: options.target,
            });

            this.layer = options.layer;

            let enabled = false
            toggle.addEventListener('click', () => {
                enabled = !enabled;

                if (enabled)
                    window.map.addLayer(options.layer);
                else
                    window.map.removeLayer(options.layer);

                toggle.innerText = (enabled ? "Disable " : "Enable ") + options.name + " layer";
            });

            if (options.enabled === true)
                toggle.click();
        }
    }

    const openRailwayMapLayer = new ol.layer.Tile({
        title: 'OpenRailwayMap',
        visible: true,
        source : new ol.source.XYZ({
            attributions : [
                'Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a> and <a href="https://osm.org/copyright"</a>OpenStreetMap</a>'
            ],
            url: 'https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
            crossOrigin: null,
            tilePixelRatio: 2,
            maxZoom: 19,
            opaque: true
        })
    })

    window.map = new ol.Map({
        controls: [
            new ol.control.Zoom(),
            new ol.control.Attribution(),
            new ol.control.FullScreen(),
            new OpenOnControl({
                coords: lonlat,
                zoom: 18
            })
        ],
        target: 'map',
        layers: [
            new ol.layer.Tile({
                title: 'OpenStreetMap',
                visible: true,
                source: new ol.source.OSM(),
            })
        ],
        view: new ol.View({
            center: [0, 0],
            zoom: 2,
        }),
    });

    window.map.addControl(new LayerToogle({
        name: "railway",
        layer: openRailwayMapLayer,
        enabled: true
    }))

    const coords = ol.proj.fromLonLat(lonlat);
    const marker = new ol.Feature({
        geometry: new ol.geom.Point(coords)
    });

    const markerStyle = new ol.style.Style({
        image: new ol.style.Icon({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: '/marker.png',
            scale: 0.25
        })
    });

    const vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [marker]
        })
    });

    marker.setStyle(markerStyle);
    vectorLayer.setZIndex( 1001 );

    window.map.getView().setCenter(coords);
    window.map.getView().setZoom(18);
    window.map.addLayer(vectorLayer);
});