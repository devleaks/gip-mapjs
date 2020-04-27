/*
 * jQuery Dashboard Widget Helper
 * 2020 Pierre M
 * License: MIT
 */
/*  Dashboard helper connects external sources (websocket)
 *  and broadcast events inside a web page to destination giplet.
 *  A giplet is an HTML element with id and receives messages through jquery trigger(msg, payload)/on(msg, payload => {}).
 */
"use strict"

Oscars = Oscars || {}

Oscars.Dashboard = (function($) {
    "use strict"

    /*
     * Default Values
     */
    var _listeners = {}
    var _options = false

    const DEFAULTS = {
        debug: false,
        elemprefix: "",
        msgprefix: "GIP-",
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

    var Dashboard = function() {}

    Dashboard.prototype.init = function(options) {
        if (_options) _options

        _options = $.extend({}, DEFAULTS, options)

        // install()
        if (_options.websocket !== null) {
            wsStart()
        }

        if (_options.debug) {
            _options.dashboard_messages.starting.created_at = new Date()
            Dashboard.prototype.broadcast({
                type: "wire",
                payload: _options.dashboard_messages.starting
            })
        }

        return _options
    }

    Dashboard.prototype.register = function(elemid, msgtype) {
        if (!_listeners.hasOwnProperty(msgtype)) {
            _listeners[msgtype] = []
        }
        if (_listeners[msgtype].indexOf(elemid) < 0) {
            _listeners[msgtype].push(elemid)
        }
        if (_options.debug)
            console.log("Dashboard::register", "#" + elemid, msgtype)
    }

    Dashboard.prototype.unregister = function(elemid, msgtype) {
        if (_listeners.hasOwnProperty(msgtype)) {
            const i = _listeners[msgtype].indexOf(elemid)
            if (i >= 0) {
                _listeners[msgtype].splice(i, 1)
            }
        }
    }

    /*
        data = {type: "string", payload: "string"}
    */
    Dashboard.prototype.broadcast = function(data) {
        const TYPE = "type"
        const PAYLOAD = "payload"
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

        if (msg.hasOwnProperty(TYPE) && msg.hasOwnProperty(PAYLOAD)) {
            const msgtype = msg[TYPE]

            if (_listeners.hasOwnProperty(msgtype) && (_listeners[msgtype].length > 0)) {
                _listeners[msgtype].forEach(function(dst, idx) {
                    if (_options.debug)
                        console.log("Dashboard::broadcast: trigger", "#" + _options.elemprefix + dst, _options.msgprefix + msgtype)
                    try {
                        $("#" + _options.elemprefix + dst).trigger(_options.msgprefix + msgtype, msg[PAYLOAD])
                    } catch (e) {
                        console.log('Dashboard::broadcast: problem during update', msg[PAYLOAD], e)
                    }
                })
            } else {
                console.log("Dashboard::broadcast: no listener for message type", msgtype, msg[PAYLOAD], _listeners)
            }

        } else {
            console.log("Dashboard::broadcast: message has no type or no payload", data)
        }
    }



    // Init & start ws connection
    function wsStart() {
        var ws = new WebSocket(_options.websocket)

        ws.onopen = function() {
            _options.dashboard_messages.opening.created_at = new Date()
            Dashboard.prototype.broadcast({
                type: "wire",
                payload: _options.dashboard_messages.opening
            })
        }
        ws.onclose = function(e) {
            if (_options.debug || true) {
                _options.dashboard_messages.closing.created_at = new Date()
                Dashboard.prototype.broadcast({
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
                Dashboard.prototype.broadcast(evt.data)
            } catch (e) {
                console.log('Dashboard::wsStart::onmessage: cannot send message', e)
                _options.dashboard_messages.error.body = 'Dashboard::wsStart::onmessage: cannot decode message'
                Dashboard.prototype.broadcast({
                    type: "wire",
                    payload: _options.dashboard_messages.error
                })
            }
        }
    }


    return Dashboard.prototype

})(jQuery)