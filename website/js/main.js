//Define default colorbrewer scheme
var colorSchemeSelect = "Greens";
var colorScheme = colorbrewer[colorSchemeSelect];

//define default number of quantiles
var quantiles = 7;

//Define quantile scale to sort data values into buckets of color
//It will not work if later the .domain is not specified
//If datapoints are negative, this needs to be initialized as
//.range(colorScheme[quantiles].reverse()) - the range set the direction of the colorscale!
var color = d3.scale
    .quantile()
    .range(colorScheme[quantiles]);

// function that matches they key of a geojson and json data file
function matchKey(datapoint, key_variable) {
    //  gets the value by matching the zip code
    return (parseFloat(key_variable[datapoint]));
}


// create the leaflet map, centered in the center of cph
var map = L.map('map').setView([55.675, 12.5561], 12);
// add title layer to map
L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {

    maxZoom: 15,
    attribution: 'asd',
    id: "giulioungaretti.k09mbfjd"
}).addTo(map);

var geojsonLayer;


function drawMap(data, geojson, data_raw) {
    // d3 loading effect
     d3.select(".spinner").remove().transition().delay(100)

    // set domain of color maps
    var min = d3.min(d3.values(data)),
        max = d3.max(d3.values(data));

    // console.log(max)
    //  set domain of color map
    color.domain([min, max]);

    // Checking to make sure colorscale is oriented correctly relative to the data - colorscale maps to abs(data)
    if (min < 0 && max < 0) {
        color.range().reverse()
    } else {
        color.range()
    };

    // control that shows state info on hover
    var info = L.control();
    info.onAdd = function(map) {
        // maybe create the div in advance ? with explanatory text ?
        this._div = L.DomUtil.create('div', 'info');
        this._div.innerHTML = '';
        return this._div;
    };
    info.addTo(map);

    // add legged
    var legend = L.control({
        position: 'bottomright'
    });

    // prepare legend with  quantile
    var quantiles = color.quantiles();

    legend.onAdd = function(map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = [min];
        for (var i = 0; i < quantiles.length; i++) {
            grades.push(quantiles[i])
        };
        var labels = [],
            from,
            to;
        for (var i = 0; i < grades.length; i++) {
            from = (grades[i]);
            to = (grades[i + 1]);
            labels.push(
                '<i style="background:' + color(from + 1) + '"></i> ' +
                Math.exp(from).toFixed(0) + (Math.exp(to) ? '&ndash;' + Math.exp(to).toFixed(0) : '+'));
        }
        div.innerHTML = labels.join('<br>');
        return div;
    };
    legend.addTo(map);

    // control appearance of the map
    // first specify the domain of the quantile color map
    function feature_style(feature) {
        return {
            weight: 1,
            opacity: 0.31,
            color: 'white',
            width: 0.5,
            fillOpacity: 0.7,
            fillColor: color(matchKey(feature.properties.id, data))
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
        //  link target highlight and info redraw
        info.update(layer.feature.properties);
    }

    function resetHighlight(e) {
        geojsonLayer.resetStyle(e.target);
        info.update();
    }

    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }

    // key-on each feature the highlight and info
    function onEachFeature(feature, layer) {
        var val = matchKey(feature.properties.id, data);
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
        return val;
    }

    geojsonLayer = L.geoJson(geojson, {
        style: feature_style,
        onEachFeature: onEachFeature
    }).addTo(map);

    info.update = function(props) {
        if (props) {
            //If value exists.
            var val = matchKey(props.id, data);
            // do your magic here Henri
            console.log(data_raw)
        } else {
            var val = 0
        }
        this._div.innerHTML = '<b>' + val + '</b> unique views per post number in: ' + (props ?
            '<b>' + props.rodenavn + '.' : 'Hover over a state');
    };

};

// define data path
dataUrl = "./data/complete_dataset.json"

function parse_data(data, weights) {
    // TODO: separate data loading and aggregation.
    var x = new Object();
    var y = new Object();
    data.forEach(
        function(d) {
            x[d.id] = d3.values(d).slice(1, 3)
            var temp = 1
            for (var i = 0; i < x[d.id].length; i++) {
                temp += parseFloat(x[d.id][i]) * parseFloat(weights[i])
            };
            y[d.id] = temp
            // d.ages + d.cars  + d.bikes + d.digging  + d.poi + d.female_singles

        })
    // returns raw data, aggregated data
    return [x, y]
}


var weights = [1, 2] // , 1, 1, 1, 1, 1, 1, 1, 1]


var names = ["#slider1"] // , "#slider1", "#slider1", "#slider1", "#slider1", "#slider1" ]

d3.select('#slider1').call(d3.slider().on("slide", function(evt, value) {
    weights[0] = value

    d3.json(dataUrl, function(error, data) {
        if (error) {
            console.log(error)
        } else {
            //get map
            d3.json("./data/taxzone.json", function(mapData) {
                data = parse_data(data, weights)
                try {
                    map.removeLayer(geojsonLayer)
                } catch (err) {
                    console.log(err)
                };

                drawMap(data[1], mapData, data[0]);
            })
        }
    });
}));