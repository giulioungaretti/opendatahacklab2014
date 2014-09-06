// create the leaflet map, centered in the center of dk
var map = L.map('map').setView([55.675, 12.5561], 12);

L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    maxZoom: 15,
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery &copy; <a href="http://mapbox.com">Mapbox</a>-',
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
    return d > 1 ? '#005a32' :
        d > 0.85 ? '#238b45' :
        d > 0.7 ? '#41ab5d' :
        d > 0.55 ? '#74c476' :
        d > 0.4 ? '#a1d99b' :
        d > 0.25 ? '#c7e9c0' :
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
        grades = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1],
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
    var max = 2*d3.mean(d3.values(data_1[0]));
    console.log(max)
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
            this._div.innerHTML = '<h4>' + dealer + '</h4>' + '<b>' + val + '</b> unique views per post number in: ' + (props ?
                '<b>' + props.rodenavn + '.' : 'Hover over a state');
        };

    };
};

function get_dealer_map(e) {
    dealer = e.srcElement.value
    var data = 'data/' + dealer + '_data.json'
    if (dealer) {
        try {
            map.removeLayer(geojson)
        }
        catch(err) {
            console.log('asd')
        }
        map_me(map, data)
    };
};

select.addEventListener("change", get_dealer_map);

var drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", dragMove)
            .on('dragend', dragEnd);

var svg = d3.select('body')
                .append('svg')
                .attr("height", 200)
                .attr("widht", 300);

var g = svg.selectAll('g')
            .data([{x: 100, y : 20}])
            .enter()
                .append('g')
                .attr("height", 200)
                .attr("widht", 300)
                .attr('transform', 'translate(20, 10)');

var rect = g
                .append('rect')
                .attr('y', 17)
                .attr("height", 5)
                .attr("width", 280)
                .attr('fill', '#C0C0C0');

g.append("circle")
    .attr("r", 20)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("fill", "#2394F5")
    .call(drag);


function dragMove(d) {
    d3.select(this)
        .attr("opacity", 0.6)
        .attr("cx", d.x = Math.max(0, Math.min(280, d3.event.x)))
        .attr("cy", d.y = 20);
};

function dragEnd() {
    d3.select(this)
        .attr('opacity', 1)
};
