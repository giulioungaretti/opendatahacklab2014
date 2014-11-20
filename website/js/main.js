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

function matchMultiKey(datapoint, key_variable) {
	//  gets the value by matching the zip code
	return (key_variable[datapoint]);
}

// create the leaflet map, centered in the center of cph
var map = L.map('map',{
  'zoomControl': false,
}).setView([55.675, 12.5561], 12);
// add title layer to map
L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
	maxZoom: 15,
	// TODO: add proper attribution i.e mapbox, cph open data.
	attribution: '',
	id: "giulioungaretti.k09mbfjd"
}).addTo(map);

// create support variable for mapping
var geojsonLayer;

// simply select existing div
var info = L.DomUtil.get("caption-right");


// add legged
var legend = L.control({
	position: 'bottomright'
});

// move zoom buttons
new L.Control.Zoom({ position: 'topright' }).addTo(map);
function drawMap(data, geojson, data_raw) {

	// set domain of color maps
	var min = d3.min(d3.values(data)),
		max = d3.max(d3.values(data));

	// console.log(max)
	//  set domain of color map
	color.domain([min, max]);

	// Checking to make sure colorscale is oriented correctly relative to the data - colorscale maps to abs(data)
	if (min < 0 && max < 0) {
		color.range().reverse();
	} else {
		color.range();
	}


	// prepare legend with  quantile
	var quantiles = color.quantiles();

	legend.onAdd = function(map) {
		var div = L.DomUtil.get('legend'),
			grades = [min];
		for (var i = 0; i < quantiles.length; i++) {
			grades.push(quantiles[i]);
		}
		var labels = [],
			from,
			to;
		for (i = 0; i < grades.length; i++) {
			from = (grades[i]);
			to = (grades[i + 1]);
			labels.push(
				'<i style="background:' + color(from + 1) + '"></i> ' +
				from.toFixed(0) + (to ? '&ndash;' + to.toFixed(0) : '+'));
		}

		// I prefer positive values at the top!
		labels.reverse()
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
	}

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
		update(layer.feature.properties);
	}

	function resetHighlight(e) {
		geojsonLayer.resetStyle(e.target);
		update();
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

	function update(props) {
			var val,
				val_array;
			if (props) {
				//If value exists.
				val = matchKey(props.id, data);
				// do your magic here Henri
				val_array = matchMultiKey(props.id, data_raw);
				// do your magic here Henri
				//val_array is an array of data indices (needs to be parseFloat before usage)

				round_val = val.toFixed(2);
			} else {
				val = "";
				round_val = "";
				// the dimensionality must be unchanged
				val_array = [, , ];
			}
			info.innerHTML = '<b>' + round_val + (props ?
				'</b> livability index in <b>' + props.rodenavn + '</b>.' : '</b><i> hover over a neighborhood </i>');
			radar(val_array);
		}
		// d3 loading effect
	d3.select(".spinner").remove().transition().delay(100);
}

function wrapData(data) {
	var wrappeddata = [{
		className: 'germany', // optional can be used for styling
		axes: [{
			axis: "cars",
			value: parseFloat(data[0])
		}, {
			axis: "bikes",
			value: parseFloat(data[1])
		}, {
			axis: "ages",
			value: parseFloat(data[2])
		}, {
			axis: "parking",
			value: parseFloat(data[3])
		}, {
			axis: "male singles",
			value: parseFloat(data[4])
		}, {
			axis: "female singles",
			value: parseFloat(data[5])
		}, {
			axis: "POI",
			value: parseFloat(data[7])
		}]
	}];
	return wrappeddata;
}

//Could add static web with average values for CPH
function radar(val1) {
	// check if value exist, if it does then plot
	// otherwise skip

	labels = ['\uf1b9', '\uf206', '\uf1fd', '\uf1b9 \uf1b9 __', '\uf183 \uf004', '\uf182 \uf004', '\uf19c']

	if (typeof val1[0] != "undefined" &&
		typeof val1[1] != "undefined" &&
		typeof val1[2] != "undefined"
	) {
		// initialize radar
		var chart = RadarChart.chart();
		// initialize config
		var cfg = chart.config()
			.w = 150
			.h = 150;
		d3.select("#radar").select('svg').remove();
		d3.select("#radar")
			.append("svg")
			.attr("width", cfg.w)
			.attr("height", cfg.h)
			.datum(wrapData(val1))
			.call(chart);
		d3.select("#radar").selectAll('.axis').select('text').attr('font-family', 'FontAwesome').attr('font-size', function(d) { return 10} ).text(function(d,i) { return labels[i];})
	} else {
		console.log('nans');
	}
}

// define data path
dataUrl = "./data/complete_dataset.json";

function parse_data(data, weights) {
	for (var index in names) {
		var name = names[index];
		stuff(index, name);
	}
	// TODO: separate data loading and aggregation.
	var x = {};
	var y = {};
	var z = {};

	// names of our data columns
	var names = d3.keys(data[0]);

	// finds max value for each data column
	var maxes = {};
	var j;
	// TODO don't make function iside loops
	for (j in names) {
		maxes[names[j]] = d3.max(data, function(d) {
			return d[names[j]];
		});
	}

	data.forEach(
		function(d) {
			x[d.id] = d3.values(d).slice(1);
			var temp = 0;
			var temp2p = [];
			for (var i = 0; i < x[d.id].length; i++) {
				temp2p.push(parseFloat(x[d.id][i]) / maxes[names[i + 1]]);
				//Weighting and normalization on the fly
				if (i == 2) {
					// The score for the ages is returned a normalized gaussian of the form
					// exp (- (( average age - own age )^2) / 2 C^2)
					// Here C sets the fall off and is currently set at 10 years, twice the step size for the slider
					temp += Math.exp((-Math.pow(parseFloat(x[d.id][i]) - parseFloat(weights[i]), 2) / (2 * (Math.pow(10, 2))))) * 10;

				} else {
					temp += parseFloat(x[d.id][i]) * parseFloat(weights[i]) / maxes[names[i + 1]]
				}
			}
			y[d.id] = temp;
			z[d.id] = temp2p;
		});
	// returns normalized and weighted aggregated data
	return [z, y];
}

var weights = [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0];

var names = ["#cars",
	"#bikes",
	"#ages",
	"#parking",
	"#m_singles",
	"#f_singles",
	"#digging",
	"#poi",
	"#free_parking"
];

function stuff(index, name) {
	var labels = ["-", "0", "+"];
	d3.select(name).call(d3.slider()
		.min(-10)
		.max(10)
		.step(2)
		.value(0.0001)
		.axis(d3.svg.axis()
			.orient("bottom")
			.ticks(3)
			.tickFormat(function(d, i) {
				return labels[i];
			})).on("slide", function(evt, value) {
			weights[index] = value;
			d3.json(dataUrl, function(error, data) {
				if (error) {
					console.log(error);
				} else {
					//get map
					d3.json("./data/taxzone.json", function(mapData) {
						data = parse_data(data, weights);
						try {
							map.removeLayer(geojsonLayer);
						} catch (err) {
							console.log(err);
						}
						drawMap(data[1], mapData, data[0]);
					});
				}
			});
			d3.select(name + 'textmin').text("--");
		}));
}

function agenormal(index, name) {
	d3.select(name)
		.call(d3.slider()
			.min(25)
			.max(75)
			.step(5)
			.value(50)
			.axis(d3.svg.axis()
				.orient("bottom")
				.ticks(3))
			.on("slide", function(evt, value) {
				weights[index] = value;
				d3.json(dataUrl, function(error, data) {
					if (error) {
						console.log(error);
					} else {
						//get map
						d3.json("./data/taxzone.json", function(mapData) {
							data = parse_data(data, weights);
							try {
								map.removeLayer(geojsonLayer);
							} catch (err) {
								console.log(err);
							}
							drawMap(data[1], mapData, data[0]);
						});
					}
				});
			}));
}


for (var index in names) {
	var name = names[index];
	if (name != "#ages") {
		stuff(index, name);
	} else if (name == "#ages") {
		agenormal(index, name);
	}
}
