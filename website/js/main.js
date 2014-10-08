function getDataUrl() {
    var h = window.location.hash;
    if (h.length > 0) {
        return h.substr(1);
    }
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
    var min = d3.min(d3.values(data[0])),
        max = d3.max(d3.values(data[0]));
    // set domain of color maps
    color.domain([min, max]);

    // create the leaflet map, centered in the center of dk
    d3.select(".spinner").remove().transition().delay(100)
    var map = L.map('map').setView([56, 10], 7);
    var url = document.URL

    // set domain of color maps
    var min = d3.min(d3.values(data[0])),
        max = d3.max(d3.values(data[0]));

    // fixing minimum number of counts to 1 to avoid problems with math
    color.domain([Math.log(1), Math.log(max)]);

    //  wrap code in try statement to test locally
    try {
        var seconds = parseInt(url.split("Expires=")[1].split("&")[0]) * 1000
        var date = new Date(seconds)
    } catch (err) {
        var date = 'date not parsed'
    }

    var max = d3.max(d3.values(data[0]));

    // add title layer to map
    L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        maxZoom: 15,
        attribution: 'Aggregated 2014 Data, Expires on ' + date + '&copy; eTilbudsavis.',
        id: 'giulio.jlndbmja'
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
        //  e.g.  feature.properties.postal
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
            fillColor: color(Math.log(matchKey(feature.properties.postal, data)))
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
        var val = matchKey(feature.properties.postal, data);
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
        return val;
    }


    // plug in topojson
    geojson = topojson.feature(geojson, geojson.objects.postnumbers_de_clean_postnumbers_dk_clean_merged);

    var geojsonLayer = L.geoJson(geojson, {
        style: feature_style,
        onEachFeature: onEachFeature
    }).addTo(map);


    info.update = function(props) {
        if (props) {
            //If value exists…
            var val = matchKey(props.postal, data);
        } else {
            var val = 0
        }
        this._div.innerHTML = '<b>' + val + '</b> unique views per post number in: ' + (props ?
            '<b>' + props.name + '.' : 'Hover over a state');
    };

};

//fetch data first
var dataUrl = getDataUrl();
if (dataUrl) {
    d3.json(getDataUrl(), function(err, data) {
        if (err) {
            alert("Sorry, no data");
        } else {
            //get map
            d3.json("./output.json", function(err, mapData) {
                if (err) {
                    alert("Sorry, no map :(");
                } else {
                    drawMap(data, mapData);
                }
            })
        }
    });
} else {
    console.log("data url is missing");
}