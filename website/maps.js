// create the leaflet map, centered in the center of dk
var map = L.map('map').setView([55.675, 12.5561], 12);

L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery &copy; <a href="http://mapbox.com">Mapbox</a>-',
    id: 'examples.map-20v6611k'
}).addTo(map);


// get color depending on population density value
function color(d) {
    //reds
    return d > 2 ? '#800026' :
        d > 1.8 ? '#BD0026' :
        d > 1.5 ? '#E31A1C' :
        d > 1 ? '#FC4E2A' :
        d > .8 ? '#FD8D3C' :
        d > .7 ? '#FEB24C' :
        d > 0.1 ? '#FED976' :
        '#FFEDA0';
}

function color(d) {
    //greeens
    return d > 1 ? '#005a32' :
        d > 0.85 ? '#238b45' :
        d > 0.6 ? '#41ab5d' :
        d > 0.52 ? '#74c476' :
        d > 0.5 ? '#a1d99b' :
        d > 0.27 ? '#c7e9c0' :
        d > 0.1 ? '#e5f5e0' :
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
        grades = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 2],
        labels = [],
        from, to;

    for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
            '<i style="background:' + color(from) + '"></i> ' +
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
        var max = 2 * d3.mean(d3.values(data_1[0]));

        function matchKey(datapoint, key_variable) {
            //  gets the value by matching the zip code
            // console.log(key_variable[0])
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
                fillColor: color(matchKey(feature.properties.id, data_1)/max)
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
            val = matchKey(feature.properties.id, data_1);
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
                val = matchKey(props.id, data_1);
            } else {
                val = 0
            }
            this._div.innerHTML = '<h4>' + dataset + '</h4>' + '<b>' + val + '</b> unique views per post number in: ' + (props ?
                '<b>' + props.rodenavn + '.' : 'Hover over a state');
        };

    };
};

function get_data_map(e) {

    if (dataset == "index"){
        console.log(dataset)
    }
    else {
        var data =
        if (dataset) {
            try {
                map.removeLayer(geojson)
            } catch (err) {
                console.log('asd')
            }
            map_me(map, data)
        };
    };
};

select.addEventListener("change", get_data_map);

// add d3 sider
// create globals

var val1 = 0
var val2 = 0
var val3 = 0

d3.select('#slider1').call(d3.slider().on("slide", function(evt, value) {
    val1 = value
}));
//value2
d3.select('#slider2').call(d3.slider().on("slide", function(evt, value) {
    val2 = value
}));
//value3
d3.select('#slider3').call(d3.slider().on("slide", function(evt, value) {
    val3 = value
}));