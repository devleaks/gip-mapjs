/*
 * jQuery Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT

 *  Helper functions.
 */
"use strict"
const VERSION = "5.0.0"
const MODULE_NAME = "Chart"


/**
 *  DEFAULT VALUES
 */
var DEFAULTS = {
    elemid: "chart_id",
    msgtype: "chart"
}


/**
 *  PRIVATE VARIABLES
 */
var _options = false
var _dashboard = null
var _charts = {}

/**
 *  PRIVATE FUNCTIONS
 */
function updateChart(chartname, data, total = 0) {
    if (_charts.hasOwnProperty(chartname)) {
        _charts[chartname].updateSeries(data)
        if (chartname == "parking") {
            _charts[chartname].updateOptions({
                plotOptions: {
                    radialBar: {
                        dataLabels: {
                            total: {
                                formatter(w) {
                                    return total
                                }
                            }
                        }
                    }
                }
            })
        }
    }
}


/**
 *  PUBLIC FUNCTIONS
 */
//
function init(options, dashboard) {
    if (_options)
        return _options

    _options = Util.extend(DEFAULTS, options)

    if (dashboard) {
        _dashboard = dashboard
    }

    if (_options.debug && _dashboard) {
        _dashboard.broadcast({
            type: "wire",
            payload: {
                source: 'gip',
                type: 'news',
                subject: 'Charts ready',
                body: "Charts initialized and ready.",
                priority: 1,
                icon: 'la-info',
                "icon-color": 'success',
                timestamp: Date.now(),
                speak: false
            }
        })
    }

    return _options
}


function getElemId() {
    return _options.elemid
}

function getTemplate() {
    // Parkings
    var chartname = "parking"
    var data = [0, 0, 0, 0, 0]
    _charts[chartname] = new ApexCharts(document.querySelector("#chart-" + chartname), {
        series: data,
        chart: {
            height: 300,
            type: 'radialBar',
        },
        plotOptions: {
            radialBar: {
                dataLabels: {
                    name: {
                        fontSize: '22px',
                    },
                    value: {
                        fontSize: '16px',
                    },
                    total: {
                        show: true,
                        label: 'Occupied',
                        formatter: function(w) {
                            // By default this function returns the average of all series. The below is just an example to show the use of custom formatter function
                            return data.reduce((a, v) => a + v)
                        }
                    }
                }
            }
        },
        labels: ['APRON 2', 'APRON 3', 'APRON 4', 'APRON 5', 'APRON 6'],
    })
    _charts[chartname].render()
    // Arrivals
    chartname = "arrival"
    _charts[chartname] = new ApexCharts(document.querySelector("#chart-" + chartname), {
        series: [{
            name: 'Arrival',
            data: [0, 0, 0, 0, 0, 0]
        }],
        chart: {
            type: 'bar',
            height: 200
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: [0, 1, 2, 3, 4, 5],
        },
        fill: {
            opacity: 1
        }
    });
    _charts[chartname].render()
    // Departures
    chartname = "departure"
    _charts[chartname] = new ApexCharts(document.querySelector("#chart-" + chartname), {
        series: [{
            name: 'Departure',
            data: [0, 0, 0, 0, 0, 0]
        }],
        chart: {
            type: 'bar',
            height: 200
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                endingShape: 'rounded'
            },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        xaxis: {
            categories: [0, 1, 2, 3, 4, 5],
        },
        fill: {
            opacity: 1
        }
    });
    _charts[chartname].render()
}

//
function update(move, datetime) {
    const S = "scheduled",
        P = "planned",
        A = "actual"

    function getTime(f) { // returns the most recent known time for flight
        var t = f.hasOwnProperty(S) ? f[S] : false
        if (f[A]) {
            t = f[A]
        } else if (f[P]) {
            t = f[P]
        }
        return t
    }

    var ts = datetime ? datetime : moment() // default to now

    var hours = Array(24).fill(0)
    for (var flightname in _flightboard[move]) {
        if (_flightboard[move].hasOwnProperty(flightname)) {
            var flight = _flightboard[move][flightname]
            if (!flight.hasOwnProperty(A)) { // if not arrived/departed
                var t = getTime(flight)
                hours[t.hours()]++
            }
        }
    }
    //update simple graph
    var hourNow = ts.hours()
    hours = hours.concat(hours)
    var forecast = hours.slice(hourNow, hourNow + 6)
    updateChart(move, [{
        name: move == "arrival" ? 'Arrival' : 'Departure',
        data: forecast
    }])

}


/**
 *  MODULE EXPORTS
 */
function version() {
    console.log(MODULE_NAME, VERSION);
}

export {
    init,
    version,
    getElemId,
    getTemplate,
    update
}