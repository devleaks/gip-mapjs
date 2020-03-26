/*
 * jQuery Dashboard Widget Helper
 * 2016 Pierre M
 * License: MIT
 */

/*  Dashboard helper connects external sources (websocket)
 *  and broadcast events inside a web page to destination giplet.
 */

"use strict";

L.Oscars = L.Oscars || {};

L.Oscars.Dashboard = (function($) {
    "use strict";

    /*
     * Default Values
     */
    var _inited = false;
    var opts;
    var defaults = {
        debug: false,
        wire_id: "gip-gip-wire",
        map_id: "gip-gip-map",
        // Defaults
        message_source: 'gip',
        message_type: 'news',
        // Websocket feeds
        websocket: null, // 'ws://localhost:8051', 'ws://hostname.local:8051'
        initSeed: null, //gipadmin/wire/seed
        markRead: null, //gipadmin/wire/read
        moreOlder: null, //gipadmin/wire/older
        // Self messages
        intro_messages: {
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
    };
    var _replay_time = new Date();
    var _replay_speed = 1;

    /*
     * Only gets called when we're using $('$el').dashboard format
     */
    var Dashboard = function() {

    }

    Dashboard.prototype.defaults = function() {
        return _inited ? opts : null;
    }

    Dashboard.prototype.init = function(options) {
        if (_inited) return;

        opts = $.extend({}, defaults, options);

        // install();
        if (opts.websocket !== null) {
            wsStart();
        }
        if (opts.initSeed !== null) {
            initSeed();
        }
        if (opts.debug) {
            opts.intro_messages.starting.created_at = new Date();
            send_to_wire(opts.intro_messages.starting);
        }
        _inited = true;
    };

    Dashboard.prototype.get_payload = function(msg) {
        if (opts.debug) {
            console.log({ code: 'Dashboard.prototype.get_payload', message: msg });
        }
        var ret = null;
        var fnd = 'nothing';
        try {
            ret = JSON.parse(msg.body);
            fnd = 'body';
        } catch (e) {
            if (opts.debug) {
                console.log('Dashboard.prototype.get_payload: cannot decode body');
                console.log(e);
            }
            try {
                ret = JSON.parse(msg.payload);
                fnd = 'payload';
            } catch (e) {
                if (opts.debug) {
                    console.log('Dashboard.prototype.get_payload: cannot decode payload');
                    console.log(e);
                }
                return false;
            }
        }
        if (opts.debug) {
            console.log('Dashboard.prototype.get_payload: found payload in ' + fnd);
        }
        return ret;
    }


    Dashboard.prototype.last_updated = function(msg, elem) {
        var now = new Date();
        if (opts.debug) {
            console.log('Dashboard.prototype.last_updated: updated at ' + now);
        }
        elem.find('.gip-footer').html('LAST UPDATED ' + now.getHours() + ':' + now.getMinutes() + ' L');
    }



    function get_giplet_id(msg) {
        var id = '#gip-';
        id += msg.source ? msg.source.toLowerCase() : opts.message_source;
        id += msg.type ? msg.type.toLowerCase() : opts.message_type;
        if (msg.hasOwnProperty("channel")) {
            if (msg.channel !== null) {
                id += ('-' + msg.channel);
            }
        }
        return id;
    }

    function send_to_wire(msg) {
        if (msg.priority > 0) {
            $('#' + opts.wire_id).trigger('gip:message', msg);
            $('#' + opts.wire_id + ' ul').scrollTop($('#' + opts.wire_id + ' ul')[0].scrollHeight);
        }
    }

    function send_to_map(msg) {
        $('#' + opts.map_id).trigger('gip:update', msg);
    }

    function isGeoJSON(feature) {
        var errs = geojsonhint.hint(feature, {
            precisionWarning: false
        });
        return errs.length == 0;
    }

    Dashboard.prototype.priority = function(msg, max_priority) {
        var priority = parseInt(msg.priority);
        if (isNaN(priority)) priority = 0;
        if (priority > max_priority) priority = max_priority;
        msg.priority = priority;
        return priority;
    }

    Dashboard.prototype.print = {
        info: function(subject, body) {
            Dashboard.prototype.broadcast({
                source: 'gip',
                type: 'internal',
                subject: subject,
                body: body,
                priority: 3,
                icon: 'fa-info',
                "icon-color": 'info'
            })
        },
        warning: function(subject, body) {
            Dashboard.prototype.broadcast({
                source: 'gip',
                type: 'internal',
                subject: subject,
                body: body,
                priority: 2,
                icon: 'fa-exclamation-triangle',
                "icon-color": 'warning'
            })
        },
        error: function(subject, body) {
            Dashboard.prototype.broadcast({
                source: 'gip',
                type: 'internal',
                subject: subject,
                body: body,
                priority: 1,
                icon: 'fa-exclamation-circle',
                "icon-color": 'danger'
            })
        }
    }

    Dashboard.prototype.broadcast = function(msg) {
        //console.log('Dashboard::broadcast', msg);
        Dashboard.prototype.init();
        if (isGeoJSON(msg)) {
            return send_to_map(msg);
        }
        //make sure there is a source and type
        if (!msg.source)
            msg.source = opts.message_source;
        if (!msg.type)
            msg.type = opts.message_type;
        //fix priority value, ensure 0<=p<=5.
        Dashboard.prototype.priority(msg);
        //build giplet id
        var gid = get_giplet_id(msg);
        //send message to giplet
        $(gid).trigger('gip:message', msg);

        //display message on wire if priority>0.
        //messages with priority < 1 are not displayed on the wire (but the recipient giplet gets the message)
        send_to_wire(msg);
    }


    // Init & start ws connection
    function wsStart() {
        var ws = new WebSocket(opts.websocket);
        ws.onopen = function() {
            opts.intro_messages.opening.created_at = new Date();
            send_to_wire(opts.intro_messages.opening);
        };
        ws.onclose = function(e) {
            const RECONNECT_TRY = 10 // seconds
            if (opts.debug) {
                opts.intro_messages.closing.created_at = new Date();
                send_to_wire(opts.intro_messages.closing);
            }
        
            console.log('Socket is closed. Reconnect will be attempted in 10 second.', e.reason);
            setTimeout(function() {
                wsStart();
            }, RECONNECT_TRY * 1000)
        
        };
        ws.onmessage = function(evt) {
            try {
                //console.log('wsStart::onMessage', evt.data);
                var msg = JSON.parse(evt.data);
                Dashboard.prototype.broadcast(msg);
            } catch (e) {
                console.log('Dashboard::wsStart: cannot decode message');
                console.log(e);
                opts.intro_messages.error.body = 'Dashboard::wsStart: cannot decode message';
                Dashboard.prototype.broadcast(opts.intro_messages.error);
            }
        };
    }

    // Fetches last messages (if url provided). Displays them all.
    function initSeed() {
        $.post(
            opts.initSeed, {},
            function(r) {
                msgs = $.parseJSON(r);
                for (var idx = msgs.length - 1; idx >= 0; idx--) { // oldest first
                    send_to_wire(msgs[idx]);
                }
            }
        );
    }

    return Dashboard.prototype;

})(jQuery);