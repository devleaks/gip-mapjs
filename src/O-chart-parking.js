/*
 * jQuery Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT

 *  Helper functions.
 */
"use strict"
const VERSION = "5.0.0"
const MODULE_NAME = "Chart-Parking"

import * as Util from './O-utils.js'

/**
 *  DEFAULT VALUES
 */
var DEFAULTS = {
    elemid: "chart-parking",
    msgtype: "parking",
    APRONS_MAX: [0],
    APRON_NAMES: ['APRON']
}

/**
 *  PRIVATE VARIABLES
 */
var _options = false
var _dashboard = null
var _chart = null

var APRONS = []

/**
 *  PRIVATE FUNCTIONS
 */
function install_handler() {
    _dashboard.register(_options.elemid, _options.msgtype)
    $("#" + _dashboard.getElemPrefix() + _options.elemid).on(_dashboard.getMessagePrefix() + _options.msgtype, function(event, message) {
        if (_options.debug)
            console.log("Map::on:parking", message)
        if (message.avail == "busy") {
            APRONS[message.parking.properties.ID_Apron_z]++
        } else {
            APRONS[message.parking.properties.ID_Apron_z] = APRONS[message.parking.properties.ID_Apron_z] == 0 ? 0 : APRONS[message.parking.properties.ID_Apron_z] - 1
        }
        var t = APRONS.map((x, i) => Math.round(100 * x / options.APRONS_MAX[i]))
        update(t.slice(Math.max(t.length - 5, 1)), APRONS.reduce((a, v) => a + v))
    })

}


function install_html() {
    var chartname = MODULE_NAME + "-" + _options.elemid
    var data = _options.APRONS_MAX
    _chart = new ApexCharts(document.querySelector("#"+_options.elemid), {
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
        labels: _options.APRON_NAMES,
    })
    _chart.render()
    console.log("chart parking",_options.elemid)
}


function update(data, total = 0) {
    _chart.updateSeries(data)
    _chart.updateOptions({
        plotOptions: {
            radialBar: {
                dataLabels: {
                    total: {
                        formatter: function(w) {
                            return total
                        }
                    }
                }
            }
        }
    })
}


/**
 *  PUBLIC FUNCTIONS
 */
//
function init(options, dashboard) {
    if (_options)
        return _options

    _options = Util.extend(DEFAULTS, options)

    APRONS = Array(_options.APRONS_MAX.length).fill(0)

    if (dashboard) {
        _dashboard = dashboard
    }

    install_html()
    install_handler()

    return _options
}


/**
 *  MODULE EXPORTS
 */
function version() {
    console.log(MODULE_NAME, VERSION);
}

export {
    init,
    version
}