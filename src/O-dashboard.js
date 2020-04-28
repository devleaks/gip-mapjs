/*
 * Oscars Geo Intelligent Platform Viewer
 * 
 * 2020 Pierre M
 * License: MIT
 *
 *  Dashboard helper connects external sources (currently websocket)
 *  and broadcast events inside a web page to the destination element.
 *  Elements first need to register with the dashboard to receive messages.
 *  Messages with no receving element are reported on console and discarded.
 */
"use strict"
const VERSION = "5.0.0"
const MODULE_NAME = "Dashboard"

import * as Util from './O-utils.js'

/**
 *  DEFAULT VALUES
 */
const DEFAULTS = {
    debug: false,
    elemprefix: "",
    msgprefix: "GIP-",
    msgTYPE: "type",
    msgPAYLOAD: "payload",

    // Websocket feeds
    websocket: null, // 'ws://localhost:8051', 'ws://hostname.local:8051', null means no conncetion
    reconnect_retry: 10, // seconds
    // Self messages
    dashboard_messages: {
        opening: {
            subject: 'Opening connection...',
            body: '... connected.',
            priority: 1,
            source: 'websocket',
            type: 'warning',
            icon: 'fa-plug',
            "icon-color": 'success'
        },
        closing: {
            subject: 'Connection closed.',
            body: 'Trying to reconnect...',
            priority: 1,
            source: 'websocket',
            type: 'warning',
            icon: 'fa-plug',
            "icon-color": 'warning'
        },
        starting: {
            subject: 'Connection',
            body: 'Connecting to server...',
            priority: 1,
            source: 'websocket',
            type: 'info',
            icon: 'fa-plug',
            "icon-color": '#0f0'
        },
        error: {
            subject: 'Dashboard Error',
            body: 'Error message',
            priority: 1,
            source: 'dashboard',
            type: 'error',
            icon: 'fa-danger',
            "icon-color": '#f00'
        }
    }
}

/**
 *  PRIVATE VARIABLES
 */
var _listeners = new Map()
var _options = false


/**
 *  PRIVATE FUNCTIONS
 */

// Start ws connection
function wsStart() {
    var ws = new WebSocket(_options.websocket)

    ws.onopen = function() {
        _options.dashboard_messages.opening.created_at = new Date()
        broadcast({
            type: "wire",
            payload: _options.dashboard_messages.opening
        })
    }
    ws.onclose = function(e) {
        if (_options.debug || true) {
            _options.dashboard_messages.closing.created_at = new Date()
            broadcast({
                type: "wire",
                payload: _options.dashboard_messages.closing
            })
        }
        console.log('Dashboard::wsStart::onclose: Socket is closed. Reconnect will be attempted in ' + _options.reconnect_retry + ' second.', e.reason, new Date())
        setTimeout(function() {
            wsStart()
        }, _options.reconnect_retry * 1000)

    }
    ws.onmessage = function(evt) {
        try {
            broadcast(evt.data)
        } catch (e) {
            console.log('Dashboard::wsStart::onmessage: cannot send message', e)
            _options.dashboard_messages.error.body = 'Dashboard::wsStart::onmessage: cannot decode message'
            broadcast({
                type: "wire",
                payload: _options.dashboard_messages.error
            })
        }
    }
}


/**
 *  PUBLIC FUNCTIONS
 */

// Internal initialisation of Dashboard
function init(options) {
    if (_options)
        return _options

    _options = Util.extend(DEFAULTS, options)

    // install()
    if (_options.websocket !== null) {
        wsStart()
    }

    if (_options.debug) {
        _options.dashboard_messages.starting.created_at = new Date()
        broadcast({
            type: "wire",
            payload: _options.dashboard_messages.starting
        })
    }

    return _options
}


function register(elemid, msgtype) {
    if (!_listeners.has(msgtype)) {
        _listeners.set(msgtype, [])
    }
    let msglisteners = _listeners.get(msgtype)
    if (msglisteners.indexOf(elemid) < 0) {
        msglisteners.push(elemid)
    }
    if (_options.debug)
        console.log("Dashboard::register", elemid, msgtype)
}


function unregister(elemid, msgtype) {
    if (_listeners.has(msgtype)) {
        let msglisteners = _listeners.get(msgtype)
        const i = msglisteners.indexOf(elemid)
        if (i >= 0) {
            msglisteners.splice(i, 1)
        }
        if(msglisteners.length == 0) {
            _listeners.delete(msgtype)
        }
    }
}


// data = {type: "string", payload: "string"}
function broadcast(data) {
    var msg = null
    if (typeof data == "string") {
        try {
            msg = JSON.parse(data)
        } catch (e) {
            console.log('Dashboard::broadcast: cannot decode message', data, e)
        }
    } else {
        msg = data
    }

    if (msg.hasOwnProperty(_options.msgTYPE) && msg.hasOwnProperty(_options.msgPAYLOAD)) {
        const msgtype = msg[_options.msgTYPE]

        if (_listeners.has(msgtype)) { // if array of listener is 0, we remove the map element
             _listeners.get(msgtype).forEach(function(dst, idx) {
                if (_options.debug)
                    console.log("Dashboard::broadcast", "#" + _options.elemprefix + dst, _options.msgprefix + msgtype)
                try {
                    $("#" + _options.elemprefix + dst).trigger(_options.msgprefix + msgtype, msg[PAYLOAD])
                    /*
                    let el = document.getElementById(_options.elemprefix + dst)
                    let event = new CustomEvent(_options.msgprefix + msgtype, { detail: msg[_options.msgPAYLOAD] });
                    el.dispatchEvent(event)
                    */
                } catch (e) {
                    console.log('Dashboard::broadcast: problem during broadcast', msg[_options.msgPAYLOAD], e)
                }
            })
        } else {
            console.log("Dashboard::broadcast: no listener for message type", msgtype, msg[_options.msgPAYLOAD], _listeners)
        }

    } else {
        console.log("Dashboard::broadcast: message has no type or no payload", data)
    }
}


function getElemPrefix() {
    return _options.elemprefix
}


function getMessagePrefix() {
    return _options.msgprefix
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
    getElemPrefix,
    getMessagePrefix,
    register,
    unregister,
    broadcast
}