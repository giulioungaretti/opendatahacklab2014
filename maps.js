// create the leaflet map, centered in the center of dk
var map = L.map('map').setView([55.6181, 12.6561], 12);

L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    maxZoom: 15,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery &copy; <a href="http://mapbox.com">Mapbox</a>-' + 'Data  &copy; eTilbudsavis.',
    id: 'examples.map-20v6611k'
}).addTo(map);


select = document.getElementById("dropdown")

// get color depending on population density value
function color(d) {
    return d > 1000 ? '#800026' :
        d > 500 ? '#BD0026' :
        d > 200 ? '#E31A1C' :
        d > 100 ? '#FC4E2A' :
        d > 50 ? '#FD8D3C' :
        d > 20 ? '#FEB24C' :
        d > 10 ? '#FED976' :
        '#FFEDA0';
}

function color(d) {
    return d > 1000 ? '#005a32' :
        d > 500 ? '#238b45' :
        d > 200 ? '#41ab5d' :
        d > 100 ? '#74c476' :
        d > 50 ? '#a1d99b' :
        d > 20 ? '#c7e9c0' :
        d > 10 ? '#e5f5e0' :
        '#f7fcf5';
}
var geojson;
var info = L.control();


// control that shows state info on hover
info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info');
    this._div.innerHTML = 'Select dealer  and Hover over a state';
    return this._div;
};

info.addTo(map);


var legend = L.control({
    position: 'bottomright'
});


// add leggend

legend.onAdd = function(map) {

    var div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [],
        from, to;

    for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
            '<i style="background:' + color(from + 1) + '"></i> ' +
            from + (to ? '&ndash;' + to : '+'));
    }

    div.innerHTML = labels.join('<br>');
    return div;
};
legend.addTo(map);


function map_me(map, data) {
    queue()
    // load json file
    .defer(d3.json, data)
    //  load map
    .defer(d3.json, 'data/taxzone.json')
    .await(makeMap)
    function makeMap(error, data_1, gjson_1) {

        function matchKey(datapoint, key_variable) {
            //  gets the value by matching the zip code
            return (parseFloat(key_variable[0][datapoint]));
        };



        function style_1(feature) {
            return {
                weight: 2,
                opacity: 1,
                color: 'white',
                width: 0.5,
                dashArray: '2',
                fillOpacity: 0.7,
                fillColor: color(matchKey(feature.properties.POSTNR, data_1))
            };
        };


        // insert highlight
        function highlightFeature(e) {
            var layer = e.target;

            layer.setStyle({
                weight: 5,
                color: '#666',
                dashArray: '2',
                fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer.bringToFront();
            }

            info.update(layer.feature.properties);
        }


        function resetHighlight(e) {
            geojson.resetStyle(e.target);
            info.update();
        }

        function zoomToFeature(e) {
            map.fitBounds(e.target.getBounds());
        }

        function onEachFeature(feature, layer) {
            val = matchKey(feature.properties.POSTNR, data_1);
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
            return val
        }

        geojson = L.geoJson(gjson_1, {
            style: style_1,
            onEachFeature: onEachFeature
        }).addTo(map);


        info.update = function(props) {
            if (props) {
                //If value exists…
                val = matchKey(props.POSTNR, data_1);
            } else {
                val = 0
            }
            this._div.innerHTML = '<h4>' + dealer + '</h4>' + '<b>' + val + '</b> unique views per post number in: ' + (props ?
                '<b>' + props.POSTNAVN + '.' : 'Hover over a state');
        };

    };
};

function get_dealer_map(e) {
    dealer = e.srcElement.value
    var data = 'data/' + dealer + '_data.json'
    if (dealer) {
        map_me(map, data)
    };
};

select.addEventListener("change", get_dealer_map);
