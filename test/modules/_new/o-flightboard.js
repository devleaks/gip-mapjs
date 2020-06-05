/*
 * jQuery Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT

 *  Helper functions.
 */
import * as Util from './o-utils.js'
import jQuery from 'jquery';
var $ = jQuery;

"use strict"
const VERSION = "5.0.0"
const MODULE_NAME = "Flightboard"

/**
 *  DEFAULT VALUES
 */
var DEFAULTS = {
    elemid: "flightboard_id",
    msgtype: "flightboard"
}


/**
 *  PRIVATE VARIABLES
 */
var _options = false
var _dashboard = null
var _flightboard = {
    arrival: {},
    departure: {}
}

/**
 *  PRIVATE FUNCTIONS
 */
function install_handler() {
    _dashboard.register(_options.elemid, _options.msgtype)
    $("#" + _dashboard.getElemPrefix() + _options.elemid).on(_dashboard.getMessagePrefix() + _options.msgtype, function(event, message) {
        if (dashboard_options.debug)
            console.log("Flightboard::on", _options.msgtype, message)
        /* message payload: {
              info: "actual",
              move: "departure",
              flight: flight.flight,
              airport: flight.airport,
              date: dept.format("DD/MM"),
              time: dept.format("HH:mm"),
              parking: flight.parking,
              timestamp: iso8601 of emission of message
        } // api:
        Oscars.Util.flightboard(move, flight, airport, timetype, day, time, note)
        */
        flightboard(message.move, message.flight, message.airport, message.info, moment(message.date + " " + message.time, message.info == "scheduled" ? "YYYY-MM-DD HH:mm" : "DD/MM HH:mm"), "")
        updateFlightboard(message.move, undefined, moment(message.timestamp, moment.ISO_8601), true)
        updateFlightboardCharts(message.move, moment(message.timestamp, moment.ISO_8601))
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

    if(dashboard) {
        _dashboard = dashboard
    }

    install_handler()

    if (_options.debug && _dashboard) {
        _dashboard.broadcast({
            type: "wire",
            payload: {
                source: 'gip',
                type: 'news',
                subject: 'Flightboard ready',
                body: "Flight boards initialized and ready.",
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
    return $('<div>')
        .append($('<div>')
            .attr("id", "flightboard")
            .append($('<header>')
                .addClass("wire-top")
                .append($('<div>')
                    .attr("id", "gip-clock-table")))
            .append($('<div>')
                .append($('<div>').attr('class', 'simulated-time yellow'))
                .append($("<table id='flightboard-arrival'>")
                    .addClass("flightboard")
                    .append($('<caption>').html('Arrival'))
                    .append($('<thead>')
                        .append($('<tr>')
                            .append($('<th>').html('Flight'))
                            .append($('<th>').html('From'))
                            .append($('<th>').html('Time'))
                            .append($('<th>').html('Estimated'))
                            .append($('<th>').html('Status'))
                            .append($('<th>').html('&nbsp;'))
                        ))
                    .append($('<tbody>'))))
            .append($('<div>')
                .append($("<table id='flightboard-departure'>")
                    .addClass("flightboard")
                    .append($('<caption>').html('Departure'))
                    .append($('<thead>')
                        .append($('<tr>')
                            .append($('<th>').html('Flight'))
                            .append($('<th>').html('To'))
                            .append($('<th>').html('Time'))
                            .append($('<th>').html('Estimated'))
                            .append($('<th>').html('Status'))
                            .append($('<th>').html('&nbsp;'))
                        ))
                    .append($('<tbody>'))
                ))
        )
}



function update(move, flightname, airport, timetype, time, note) {
    var lnote = note != "" ? note : (timetype == "actual" ? (move == "departure" ? "" : "Landed") : "")
    _flightboard[move] = _flightboard.hasOwnProperty(move) ? _flightboard[move] : {}
    _flightboard[move][flightname] = _flightboard[move].hasOwnProperty(flightname) ? _flightboard[move][flightname] : {}
    var flight = _flightboard[move][flightname]
    flight.name = flightname
    flight.airport = airport
    flight[timetype] = time
    flight.note = lnote
    flight.isnew = true
    if (timetype == "actual") { // if move completed, schedule removal from flightboard
        flight.removeAt = moment(time).add(move == "arrival" ? 30 : 10, "minutes")
    }
}

//
function updateFlightboard(move, maxcount = 12, datetime = false, solari = false) {
    const SOLARI = 'solari' // name of css class
    const MINROWS = 12

    const S = "scheduled",
        P = "planned",
        A = "actual"

    const Mdefault = '<span class="left off"></span><span class="right off"></span>',
        Msuccess = '<span class="left green"></span><span class="right off"></span>',
        Mdanger = '<span class="left off"></span><span class="right red"></span>',
        Mboarding = '<span class="left off boarding-left"></span><span class="right off boarding-right"></span>'

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

    // sort flights to show most maxcount relevant flights for move
    // 1. Recently landed
    // 2. Arriving soon
    // 3. Arriving later
    // Remove landed more than 30min earlier
    var scroll = true // will flip true if first line is removed (and all subsequent lines move up)
    var farr = []
    var hours = Array(24).fill(0)
    for (var flightname in _flightboard[move]) {
        if (_flightboard[move].hasOwnProperty(flightname)) {
            var flight = _flightboard[move][flightname]
            if (!flight.hasOwnProperty(A)) { // if not arrived/departed
                var t = getTime(flight)
                hours[t.hours()]++
            }
            var showflight = true
            if (flight.hasOwnProperty('removeAt')) {
                if (flight.removeAt.isBefore(ts)) {
                    showflight = false
                }
            }
            if (showflight) {
                farr.push(flight)
            }

        }
    }
    //farr = farr.sort((a, b) => (moment(getTime(a)).isAfter(moment(getTime(b)))))
    farr = farr.sort((a, b) => (moment(a[S]).isAfter(moment(b[S]))))
    farr = farr.splice(0, maxcount)

    //update simple graph
    var hourNow = ts.hours()
    hours = hours.concat(hours)
    var forecast = hours.slice(hourNow, hourNow + 6)
    Oscars.Map.updateChart(move, [{
        name: move == "arrival" ? "Arrival" : "Departure",
        data: forecast
    }])

    // build table
    var tb = $('<tbody>')
    for (var i = 0; i < farr.length; i++) {
        var flight = farr[i]
        if (true
            /*(count++ < maxcount)
            &&
            ((!flight.hasOwnProperty('removeAt')) ||
                (flight.hasOwnProperty('removeAt') && flight.removeAt.isBefore(ts)))*/
        ) {
            var t = false
            var s = true
            var cnew = ''
            var cupd = ''
            var status = Mdefault
            var scolor = ''
            if (flight.hasOwnProperty(A)) {
                t = flight[A]
                if (flight.hasOwnProperty(S)) {
                    var diff = moment.duration(flight[A].diff(flight[S])).asMinutes()
                    if (diff > 15) { // minutes
                        flight.note = (move == "departure" ? "Delayed +" : "Landed +") + diff + " min"
                        s = false
                        scolor = 'red'
                    }
                }
                status = Mdefault
                if (flight.isnew) {
                    _flightboard[move][flightname].isnew = false
                    cupd = SOLARI
                }
            } else if (flight.hasOwnProperty(P)) {
                t = flight[P]
                if (flight.hasOwnProperty(S)) {
                    var diff = moment.duration(flight[P].diff(flight[S])).asMinutes()
                    if (diff > 15) { // minutes
                        _flightboard[move][flightname].note = "Delayed" // "Delayed "+diff+" min"
                        s = false
                    }
                }
                if (flight.isnew) {
                    flight.isnew = false
                    cupd = SOLARI
                }
                status = s ? Msuccess : Mdanger
                if (move == "departure" && !flight.hasOwnProperty(A)) {
                    var boarding = moment.duration(flight[P].diff(ts)).asMinutes()
                    if (boarding < 40) { // minutes
                        status = Mboarding // :-)
                        flight.note = boarding < 20 ? "LAST CALL" : "Boarding"
                        scolor = boarding < 20 ? 'red' : 'green'
                    }
                }
            } else {
                if (flight.isnew) {
                    _flightboard[move][flightname].isnew = false
                    cnew = SOLARI
                }
            }

            if (scroll && flight.hasOwnProperty("position") && flight.position != i) { // the entire line moves and changes
                cnew = SOLARI
                cupd = SOLARI
            }

            tb.append(
                $('<tr>')
                .append($('<td>').addClass(cnew).html(flight.name))
                .append($('<td>').addClass(cnew).html(flight.airport))
                .append($('<td>').addClass(cnew).html(flight.hasOwnProperty(S) ? flight[S].format("HH.mm") : ".".repeat(5)))
                .append($('<td>').addClass(cupd).html(t ? t.format("HH.mm") : ".".repeat(5)))
                .append($('<td>').addClass(scolor).addClass('scrolling').html(flight.note ? flight.note : ''))
                .append($('<td>').append($('<div>').addClass('status').html(status)))
            )

            _flightboard[move][flight.name].newposition = i
        }
    }

    // add at least 12 lines to the board
    if ($(tb).find("tr").length < MINROWS) {
        for (var i = $(tb).find("tr").length; i < MINROWS; i++) {
            tb.append(
                $('<tr>')
                .append($('<td>').html(".".repeat(7)))
                .append($('<td>').html(".".repeat(3)))
                .append($('<td>').html(".".repeat(5)))
                .append($('<td>').html(".".repeat(5)))
                .append($('<td>').html(''))
                .append($('<td>').append($('<div>').addClass('status').html(Mdefault)))
            )
        }
    }

    // Reset position of lines off the board...
    for (var flightname in _flightboard[move]) {
        if (_flightboard[move].hasOwnProperty(flightname)) {
            delete _flightboard[move][flightname].position
            if (_flightboard[move][flightname].hasOwnProperty('newposition')) {
                _flightboard[move][flightname].position = _flightboard[move][flightname].newposition
                delete _flightboard[move][flightname].newposition
            }
        }
    }

    /*
    $('.scrolling').textMarquee({
        mode: 'loop'
    })
    */
    $('#flightboard-' + move + ' tbody').replaceWith(tb)
    if (solari) {
        $('#flightboard-' + move + ' tbody tr td').each(function(td) {
            if ($(this).hasClass(SOLARI)) {
                $(this).removeClass(SOLARI)
                var s = new flipper(this);
                s.start();
            }
        })
    }
}

//
function updateFlightboardCharts(move, datetime) {
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

    // @HARDCODED!!
    $("#" + _dashboard.getElemPrefix() + "Chart-Stress").trigger(_dashboard.getMessagePrefix() + "move", {
        name: move == "arrival" ? 'Arrival' : 'Departure',
        data: forecast
    })
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
    update,
    updateFlightboard,
    updateFlightboardCharts
}