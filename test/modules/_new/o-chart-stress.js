/*
 * jQuery Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT

 *  Helper functions.
 */
"use strict"
const VERSION = "5.0.0"
const MODULE_NAME = "Chart-Stress"

import * as Util from './o-utils.js'

/**
 *  DEFAULT VALUES
 */
var DEFAULTS = {
    elemid: "chart-stress",
    msgtype: "move",
    move: "move",
    categories: [0, 1, 2, 3, 4, 5]
}


/**
 *  PRIVATE VARIABLES
 */
var _options = false
var _dashboard = null
var _charts = new Map() // accessed by _options.move as key

/**
 *  PRIVATE FUNCTIONS
 */
function install_handler() {
    _dashboard.register(MODULE_NAME, _options.msgtype)
    $("#" + _dashboard.getElemPrefix() + MODULE_NAME).on(_dashboard.getMessagePrefix() + _options.msgtype, function(event, message) {
        if (_options.debug)
            console.log(MODULE_NAME+"::on:Chart-Stress", message)
        if (message.move == _options.move) {
            update([message])
        }
    })
}


function install_html() {
    var chartname = MODULE_NAME + "-" + _options.elemid
    var data = Array(_options.categories.length).fill(0)
    var chart = new ApexCharts(document.querySelector("#" + _options.elemid), {
        series: [{
            name: _options.move,
            data: data
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
            categories: _options.categories,
        },
        fill: {
            opacity: 1
        }
    })
    _charts.set(_options.move, chart)
    chart.render()
}


function update(data) {
    var chart = _charts.get(data.move)
    chart.updateSeries(data)
}


/**
 *  PUBLIC FUNCTIONS
 */
//
function init(options, dashboard) {
    if (_options && !options.force)
        return _options

    _options = Util.extend(DEFAULTS, options)

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