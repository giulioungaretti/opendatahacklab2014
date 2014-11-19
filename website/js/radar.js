RadarChart.defaultConfig.color = function() {};
RadarChart.defaultConfig.radius = 3;
RadarChart.defaultConfig.w = 400;
RadarChart.defaultConfig.h = 400;
// input
var fuck_me = [1, 2, 3, 5]

// dummy data
var data = [{
    className: 'germany', // optional can be used for styling
    axes: [{
        axis: "strength",
        value: 13
    }, {
        axis: "intelligence",
        value: 6
    }, {
        axis: "charisma",
        value: 5
    }, {
        axis: "dexterity",
        value: 9
    }, {
        axis: "luck",
        value: 2
    }]
}, {
    className: 'argentina',
    axes: [{
        axis: "strength",
        value: 6
    }, {
        axis: "intelligence",
        value: 7
    }, {
        axis: "charisma",
        value: 10
    }, {
        axis: "dexterity",
        value: 13
    }, {
        axis: "luck",
        value: 9
    }]
}];


// do the plotting
var chart = RadarChart.chart();
var svg = d3.select('info').append('svg')
    .attr('width', 600)
    .attr('height', 800);


// draw one
svg.append('g').classed('focus', 1).datum(data).call(chart);
