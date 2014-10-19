//Define default colorbrewer scheme
var colorSchemeSelect = "Greens";
var colorScheme = colorbrewer[colorSchemeSelect];

//define default number of quantiles
var quantiles = 5;

//Define quantile scale to sort data values into buckets of color
//It will not work if later the .domain is not specified
var color = d3.scale.quantile()
    .range(colorScheme[quantiles]);

// function that matches they key of a geojson and json data file
function matchKey(datapoint, key_variable) {
    //  gets the value by matching the zip code
    return (parseFloat(key_variable[0][datapoint]));
}


//Define default colorbrewer scheme
var colorSchemeSelect = "Greens";
var colorScheme = colorbrewer[colorSchemeSelect];

//define default number of quantiles
var quantiles = 5;

//Define quantile scale to sort data values into buckets of color
//It will not work if later the .domain is not specified
var color = d3.scale.quantile()
    .range(colorScheme[quantiles]);


function drawMap(data, geojson) {
    console.log(d3.values(d3.values(data[0]  )))

    var min = d3.min(d3.values(data[0])),
        max = d3.max(d3.values(data[0]));
    // set domain of color maps
    color.domain([min, max]);
    // d3 loading effectxw
    d3.select(".spinner").remove().transition().delay(100)
    // create the leaflet map, centered in the center of dk
    var map = L.map('map').setView([55.675, 12.5561], 12);

    // set domain of color maps
    var min = d3.min(d3.values(data[0])),
        max = d3.max(d3.values(data[0]));

    // fixing minimum number of counts to 1 to avoid problems with math
    color.domain([Math.log(1), Math.log(max)]);

    var max = d3.max(d3.values(data[0]));

    // add title layer to map
    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        maxZoom: 15,
        attribution: 'asd',
        id: "giulio.jnapjmgp"
    }).addTo(map);

    // control that shows state info on hover
    var info = L.control();
    info.onAdd = function(map) {
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

    function matchKey(datapoint, key_variable) {
        //  gets the value by matching the key_variable
        //  e.g.  feature.properties.id
        return (parseFloat(key_variable[0][datapoint]));
    };


    function feature_style(feature) {
        return {
            weight: 1,
            opacity: 0.31,
            color: 'white',
            width: 0.5,
            dashArray: '2',
            fillOpacity: 0.7,
            fillColor: color(Math.log(matchKey(feature.properties.id, data)))
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
        geojsonLayer.resetStyle(e.target);
        info.update();
    }

    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
        var val = matchKey(feature.properties.id, data);
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
        return val;
    }


    // plug in topojson

    var geojsonLayer = L.geoJson(geojson, {
        style: feature_style,
        onEachFeature: onEachFeature
    }).addTo(map);


    info.update = function(props) {
        if (props) {
            //If value exists…
            var val = matchKey(props.id, data);
        } else {
            var val = 0
        }
        this._div.innerHTML = '<b>' + val + '</b> unique views per post number in: ' + (props ?
            '<b>' + props.rodenavn + '.' : 'Hover over a state');
    };

};

//fetch data first

dataUrl = './data/final_index.json'

d3.json(dataUrl, function(err, data) {
    if (err) {
        alert("Sorry, no data");
    } else {
        //get map
        d3.json("./data/taxzone.json", function(err, mapData) {
            if (err) {
                alert("Sorry, no map :(");
            } else {
                drawMap(data, mapData);
            }
        })
    }
});

// add d3 siderk

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