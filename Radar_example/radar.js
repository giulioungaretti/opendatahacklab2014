RadarChart.defaultConfig.color = function() {};

// input
var fuck_me = [5, 5, 0.2, 5, 5, 3, 4, 2, 4]


function wrapData(data) {

    var wrappeddata = [{
        className: 'germany', // optional can be used for styling
        axes: [{
            axis: "cars",
            value: data[0]
        }, {
            axis: "bikes",
            value: data[1]
        }, {
            axis: "ages",
            value: data[2]
        // }, {
        //     axis: "parking",
        //     value: data[3]
        // }, {
        //     axis: "male singles",
        //     value: data[4]
        // }, {
        //     axis: "female singles",
        //     value: data[5]
        // }, {
        //     axis: "digging",
        //     value: data[6]
        // }, {
        //     axis: "POI",
        //     value: data[7]
        // }, {
        //     axis: "free parking",
        //     value: data[8]
        }]
    }];

    return wrappeddata

}

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
var svg = d3.select('#radar').append('svg')
    .attr('width', 200)
    .attr('height',200);

var dat = wrapData(fuck_me)
// draw one
svg.append('g').classed('focus', 1).datum(dat).call(chart);