/*
 * jQuery Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict";

var Oscars = Oscars || {};

Oscars.Util = (function() {
    /**
     *  DEFAULT VALUES
     */
    // Defaults as used if no default is provided
    const VERSION = "2.0.0"
    var DEFAULT = {
        MARKER_MIN_SIZE: 15, // px
        BACKGROUND_COLOR: "transparent",
        ICON_STYLE: "border: none;",
        TOOLTIP_CLASSNAME: "oscars-label",
        SPEED_VECTOR: {
            weight: 2,
            color: '#f30',
            fillOpacity: 0.06,
            vectorLength: 5
        },
        STYLE: {
            markerSymbol: "map-marker",
            markerSize: 24, // px
            markerColor: "rgb(0,128,256)", // lighter blue
            color: "darkgrey", // stroke color
            opacity: 0.6, // stroke opacity 0 = transparent
            weight: 1, // stroke width
            fillColor: "darkgrey", // fill color
            fillOpacity: 0.2, // fill opacity 1 = opaque
            fillPattern: "solid", // fill pattern (currently unused)
            inactiveMarkerColor: "darkgrey"
        },
        INFO_ID: "info",
        INFO_CONTENT_ID: "device-info"
    };
    // new defaults
    var _options = false;
    /**
     *  PRIVATE VARIABLES
     */
    // small graphs
    var _sparklines = {};
    // Track keeping
    // L.Control for sidebar information
    var _sidebar = null;
    var _showInfo = false;
    // Markers that have a physical size and need adjustments on zoom changes
    var _phyMarkers = {};

    var _flightboard = {
        arrival: {},
        departure: {}
    }

    /**
     *  PRIVATE FUNCTIONS
     */
    // Check property existance
    function isSet(property) {
        return typeof property != "undefined" && (property || property === false);
    }

    function nvl(val, dft) {
        return isSet(val) ? val : dft
    }

    //
    function getDefaults() {
        if (typeof _options.STYLE == "undefined") {
            _options = $.extend(true, {}, DEFAULT);
            // Build default icon
            _options.ICON = L.BeautifyIcon.icon({
                icon: _options.STYLE.markerSymbol,
                textColor: _options.STYLE.markerColor,
                innerIconStyle: "font-size: " + _options.STYLE.markerSize + 'px;',
                backgroundColor: _options.BACKGROUND_COLOR,
                iconStyle: _options.ICON_STYLE
            });
            // Build default marker
            _options.MARKER = { icon: _options.ICON }; // use: var marker = L.marker(latLng(lat,lon), _options.MARKER);
        }
        return _options;
    }

    // Returns single LeafletJS LatLng object from feature's geometry.
    function getLatLng(feature) {
        return L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
    }

    // Calculate a feature's pixel dimension from its physical size
    function getFontSizePx(feature) {
        var style = feature.properties._style; //@todo if no style?
        var pixels = 0;
        if (isSet(feature.properties.physicalSize)) {
            var metersPerPixel = getMetersPerPixel();
            if (metersPerPixel > 0) {
                pixels = Math.round(feature.properties.physicalSize / metersPerPixel);
                addResizeMarker(feature);
            }
        } else if (isSet(style.markerSize)) {
            var numMarkerSize = String(style.markerSize).replace(/[^0-9$.,]/g, '');
            pixels = parseInt(style.markerSize) ? parseInt(style.markerSize) : _options.STYLE.markerSize;
        }
        return pixels;
    }

    // Returns properly sized & styled icon from Point feature type, status, and display_status.
    function getIcon(feature) {
        if (!isSet(feature.properties._style)) {
            console.log("Oscars.Util::getIcon: Warning - Feature has no style, using default", feature);
            feature.properties._style = _options.STYLE;
        }
        if (isSet(feature.properties._data)) {
            return getSparkline(feature);
        }
        var style = feature.properties._style;
        var size = getFontSizePx(feature);
        return L.BeautifyIcon.icon({
            icon: (isSet(style.markerSymbol)) ? style.markerSymbol : _options.STYLE.markerSymbol,
            prefix: "la",
            textColor: (isSet(style.markerColor)) ? style.markerColor : _options.STYLE.markerColor,
            innerIconStyle: "font-size: " + (size < _options.MARKER_MIN_SIZE ? _options.MARKER_MIN_SIZE : size) + 'px;',
            backgroundColor: (isSet(style.backgroundColor)) ? style.backgroundColor : _options.BACKGROUND_COLOR,
            iconStyle: (isSet(style.iconStyle)) ? style.iconStyle : _options.ICON_STYLE
        });
    };

    // Sanitize feature.properties.name to be used as classname.
    function sanitizeClassname(name) {
        return name.replace(/[^a-z0-9]/g, function(s) {
            var c = s.charCodeAt(0);
            if (c == 32) return '-';
            if (c >= 65 && c <= 90) return '_' + s.toLowerCase();
            return '__' + ('000' + c.toString(16)).slice(-4);
        });
    }

    // Returns properly sized & styled icon from Point feature type, status, and display_status.
    function getSparkline(feature) {
        var peityTypeOptions = {
            pie: ['delimiter', 'fill', 'height', 'radius', 'width'],
            donut: ['delimiter', 'fill', 'height', 'radius', 'width', 'innerRadius'],
            bar: ['delimiter', 'fill', 'height', 'max', 'min', 'padding', 'width'],
            line: ['delimiter', 'fill', 'height', 'max', 'min', 'stroke', 'strokeWidth', 'width']
        };
        if (!isSet(feature.properties._data)) {
            console.log("Oscars.Util::getSparkline: Warning - Feature has no data", feature);
            return null;
        }
        var name = sanitizeClassname(feature.properties.name);
        var chartType = isSet(feature.properties._data.type) ? feature.properties._data.type : 'pie',
            data = feature.properties._data.values;
        if (['pie', 'donut', 'bar', 'line'].indexOf(chartType) == -1) {
            console.log("Oscars.Util::getSparkline: Warning - Invalid chart type, forcing pie", feature);
            chartType = 'pie';
        }
        if (Array.isArray(data))
            data = data.join();

        // build option array depending on char type
        var optionList = peityTypeOptions[chartType]
        var options = {}
        optionList.forEach(function(o) {
            if (feature.properties._data.hasOwnProperty(o)) {
                options[o] = feature.properties._data[o]
            }
        })
        var html = (Object.keys(options).length > 0) ? '<span class="' + name + '" data-peity=\'' + JSON.stringify(options) + '\'>' + data + '</span>' : '<span class="' + name + '">' + data + '</span>'

        var icon = L.divIcon({
            html: html,
            className: 'leafletjs-peity' // removes bg and border
        });
        _sparklines[name] = chartType;
        jQuery(document).ready(function($) {
            $('.' + name).peity(chartType);
        });
        return icon;
    };

    // Install click events
    function bindTexts(feature, layer) {
        var showLabel = function(f) {
            return isSet(f.properties._templates) && isSet(f.properties._templates.show_label) && f.properties._templates.show_label;
        }

        if (isSet(feature.properties) && isSet(feature.properties._templates)) {
            var bound = [];
            feature.properties._texts = feature.properties._texts || {};
            ["linkText", "linkURL", "label", "tooltip", "popup", "sidebar"].forEach(function(s) {
                var text = (typeof(feature.properties._texts[s]) != "undefined") ? feature.properties._texts[s] : null;
                if (typeof(feature.properties._templates[s]) != "undefined" && feature.properties._templates[s] != null && !text) {
                    feature.properties._texts[s] = Mustache.render(feature.properties._templates[s], {
                        feature: feature,
                        templates: feature.properties._templates || {},
                        texts: feature.properties._texts || {}
                    });
                }
                // if some text, use it for its purpose
                if (feature.properties._texts[s]) {
                    switch (s) {
                        case "label": // only one of label or tooltip. First one gets installed, second one does not get installed. Label gets tested first.
                            if (!layer.getTooltip() && showLabel(feature)) {
                                layer.bindTooltip(feature.properties._texts.label, { direction: "center", className: "oscars-label", permanent: true });
                                bound.push(s);
                            }
                            break;
                        case "tooltip":
                            if (!layer.getTooltip()) {
                                layer.bindTooltip(feature.properties._texts.tooltip, { direction: "top", className: "oscars-tooltip", permanent: false });
                                bound.push(s);
                            }
                            break;
                        case "popup":
                            layer.bindPopup(feature.properties._texts.popup);
                            bound.push(s);
                            break;
                        case "sidebar":
                            if (_showInfo) {
                                layer.on("contextmenu", function onClick(e) {
                                    var defs = getDefaults();
                                    if (isSet(feature.properties._texts.sidebar)) {
                                        Oscars.Omap.setSidebarContent(feature.properties._texts.sidebar)
                                    } else {
                                        console.log("Oscars.Util::bindTexts: Warning - No sidebar text.", feature);
                                    }
                                });
                                bound.push(s);
                            }
                            break;
                    }
                    feature.properties._bound = bound.join(); // mainly for debug
                }
            });
        }

    }

    // Draws a vector in front of oriented icon to show potential displacement before next anticipated update
    function getVector(feature) {
        if (feature.properties.heading != null) { // if there is a heading
            var opts = getDefaults();
            opts.SPEED_VECTOR.clickable = false;
            if (feature.properties.speed != null) { feature.length = feature.properties.speed * opts.SPEED_VECTOR.vectorLength; } // and a speed
            if (feature.length != null && feature.length > 0) {
                var ll = getLatLng(feature);
                var x = ll.lng; // X coordinate
                var y = ll.lat * 1; // Y coordinate
                var ll1 = ll;
                var angle = feature.properties.heading * 1;
                var lengthAsDegrees = feature.length / 110540; // metres in a degree..ish
                var polygon = null;
                if (feature.properties.accuracy != null) {
                    feature.properties.accuracy = Number(feature.properties.accuracy);
                    var y2 = y + Math.sin((90 - angle + feature.properties.accuracy) / 180 * Math.PI) * lengthAsDegrees * Math.cos(y / 180 * Math.PI);
                    var x2 = x + Math.cos((90 - angle + feature.properties.accuracy) / 180 * Math.PI) * lengthAsDegrees;
                    var ll2 = new L.LatLng(y2, x2);
                    var y3 = y + Math.sin((90 - angle - feature.properties.accuracy) / 180 * Math.PI) * lengthAsDegrees * Math.cos(y / 180 * Math.PI);
                    var x3 = x + Math.cos((90 - angle - feature.properties.accuracy) / 180 * Math.PI) * lengthAsDegrees;
                    var ll3 = new L.LatLng(y3, x3);
                    polygon = L.polygon([ll1, ll2, ll3], opts.SPEED_VECTOR);
                } else {
                    var ya = y + Math.sin((90 - angle) / 180 * Math.PI) * lengthAsDegrees * Math.cos(y / 180 * Math.PI);
                    var xa = x + Math.cos((90 - angle) / 180 * Math.PI) * lengthAsDegrees;
                    var lla = new L.LatLng(ya, xa);
                    polygon = L.polygon([ll1, lla], opts.SPEED_VECTOR);
                }
                return polygon;
            }
        }
        return null;
    }

    // Compute rotation if requested
    function getRotation(feature) {
        var style = feature.properties._style;
        var rotation = 0.0;
        var notdone = true;
        const ROATION_PROPERTIES = ['heading', 'bearing', 'orientation', 'orient']
        ROATION_PROPERTIES.forEach(function(prop) {
            if (feature.properties.hasOwnProperty(prop) && notdone) { // has rotation
                var r = parseFloat(feature.properties[prop])
                if (!isNaN(r)) {
                    rotation = r
                    notdone = false;
                }
            }
        });

        if (style.hasOwnProperty("markerRotationOffset")) { // has rotation offset = need to rotate icon
            var r = parseFloat(style.markerRotationOffset)
            if (!isNaN(r)) {
                rotation += r
            }
        }
        return rotation
    }

    // Returns oriented marker with icon for Point feature. Always returns a marker (defaults if needed).
    function getMarker(feature) {
        // Get styled icon or sparkline graph. If feature contains data, icon is always regenerated (sparkline from data).
        if (!isSet(feature.properties._icon) || isSet(feature.properties._data)) {
            feature.properties._icon = getIcon(feature);
        }

        var markerOptions = {
            icon: feature.properties._icon
        };

        // Add vector
        var vector = getVector(feature);
        if (vector) {
            markerOptions.vector = vector;
        }

        // Rotate marker
        var rotation = getRotation(feature);
        if (rotation != 0.0) {
            markerOptions.rotationAngle = rotation;
        }

        // Assemble marker appearance and behavior
        var layer = L.marker(getLatLng(feature), markerOptions);

        // Add texts
        bindTexts(feature, layer);

        // Add vector
        Oscars.Omap.vector(vector, layer)

        return layer ? layer : L.marker(latlng, _options.MARKER);
    }

    // Keep track of marker to resize on zoom in/out
    function addResizeMarker(feature) {
        _phyMarkers[feature.properties.name] = feature;
    }

    // Resizes physical sized markers upon zoom change.
    function resizeMarkers(e) {
        for (var fname in _phyMarkers) {
            if (_phyMarkers.hasOwnProperty(fname)) {
                //safari bug?
                var feature = typeof _phyMarkers[fname].feature == "undefined" ? _phyMarkers[fname] : _phyMarkers[fname].feature;
                delete feature.properties._icon; // needs to recreate it with proper size
                feature.properties._layer.update(feature);
            }
        }
    }

    // Set feature.properties._touched to now().  
    function touch(feature) {
        feature.properties._touched = Date.now();
    }


    /**
     *  PUBLIC INTERFACE
     */
    return {
        updateSparklines: function() {
            jQuery(document).ready(function($) {
                for (var name in _sparklines) {
                    if (_sparklines.hasOwnProperty(name))
                        $('.' + name).peity(_sparklines[name]);
                    console.log("Util::updateSparklines", name)
                }
            });
        },

        style: function(feature) {
            touch(feature)
            return (feature && feature.properties && feature.properties._style) ? feature.properties._style : getDefaults().STYLE
        },

        // Spawn layer from feature
        pointToLayer: function(feature, latlng) {
            touch(feature)
            feature.properties = feature.properties || {}
            feature.properties._marker = Oscars.Util.getMarker(feature)
            return feature.properties._marker
        },

        onEachFeature: function(feature, layer) {
            feature.properties = feature.hasOwnProperty("properties") ? feature.properties : {}
            feature.properties._featureLayer = layer // feature.properties._layer = layer where feature is added
            Oscars.Util.bindTexts(feature, layer)
        },


        // specific to L.realtime
        updateFeature: function(feature, oldLayer) {
            touch(feature)
            feature.properties = feature.properties || {}
            feature.properties._icon = Oscars.Util.getIcon(feature)
        },


        /*
        flight structure:
        {
            name: ,
            airport: ,
            scheduled: , 
            planned: ,
            actual: ,
            note: ,
            isnew: ,
            removeAt: 
        }
        */
        flightboard: function(move, flightname, airport, timetype, time, note, parking) {
            var lnote = note != "" ? note : (timetype == "actual" ? (move == "departure" ? "" : "Landed") : "")
            _flightboard[move] = _flightboard.hasOwnProperty(move) ? _flightboard[move] : {}
            _flightboard[move][flightname] = _flightboard[move].hasOwnProperty(flightname) ? _flightboard[move][flightname] : {}
            var flight = _flightboard[move][flightname]
            flight.name = flightname
            flight.airport = airport
            flight[timetype] = time
            flight.note = lnote
            flight.parking = parking
            flight.isnew = true
            if (timetype == "actual") { // if move completed, schedule removal from flightboard
                flight.removeAt = moment(time).add(move == "arrival" ? 30 : 10, "minutes")
            }
        },


        getFlight: function(flightname, move = false) {
            if (!move) {
                if (_flightboard["arrival"].hasOwnProperty(flightname)) {
                    return _flightboard["arrival"][flightname]
                }
                if (_flightboard["departure"].hasOwnProperty(flightname)) {
                    return _flightboard["departure"][flightname]
                }
            } else {
                if (_flightboard[move].hasOwnProperty(flightname)) {
                    return _flightboard[move][flightname]
                }
            }
            console.log("getFlight", "flight not found", flightname, move, _flightboard)
            return null
        },

        getDepartureFlight: function(flightname) {
            const arrival = Oscars.Util.getFlight(flightname, "arrival")
            var departure = false
            for (var f in _flightboard["departure"]) {
                if (!departure && _flightboard["departure"].hasOwnProperty(f)) {
                    const flight = _flightboard["departure"][f]
                    if (flight.parking == arrival.parking) {
                        if (flight.scheduled &&
                            arrival.scheduled &&
                            flight.scheduled.isAfter(arrival.scheduled)) {
                            departure = flight
                        }
                    }
                }
            }
            if (!departure) {
                console.log("getDepartureFlight", "flight not found", flightname, _flightboard)
            }
            return departure
        },

        //
        updateFlightboard: function(move, maxcount = 12, datetime = false, solari = false) {
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
            Oscars.Omap.updateChart(move, [{
                name: 'Arrival',
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

            /*$('.scrolling').textMarquee({
                mode: 'loop'
            })*/
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
        },

        //
        updateFlightboardCharts: function(move, datetime) {
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
            Oscars.Omap.updateChart(move, [{
                name: 'Arrival',
                data: forecast
            }])

        },


        // Get or generate a feature id
        getFeatureId: function(feature, errmsg) {
            if (feature.hasOwnProperty("id")) {
                return feature.id
            }
            // creates feature.id since it does not exist
            if (feature && feature.hasOwnProperty("properties")) {
                var fp = feature.properties
                if (fp.hasOwnProperty("id")) {
                    feature.id = fp.id
                    return feature.id
                } else if (fp.hasOwnProperty("name")) {
                    feature.id = fp.name
                    return feature.id
                }
            }
            console.log(errmsg, feature)
            return null
        },

        featureIds: function(geojson) {
            var ids = []
            if (geojson.type == "FeatureCollection") {
                geojson.features.forEach(function(f, idx) {
                    var fid = Oscars.Util.getFeatureId(feature, "collectFeatureIds:FeatureCollection")
                    if (fid) {
                        ids.push(fid)
                    }
                })
            } else if (geojson.type == "Feature") {
                var fid = Oscars.Util.getFeatureId(geojson, "collectFeatureIds:Feature")
                if (fid) {
                    ids.push(fid)
                }
            }
            return ids
        },

        // Get or generate a feature id
        getLayerFeatureId: function(layer) {
            return layer.hasOwnProperty("feature") ? Oscars.Util.getFeatureId(layer.feature) : false
        },

        // Generates random UUID (https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript)
        uuidv4: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        // returns default values for styles, icons, markers
        getDefaults: function() {
            return getDefaults();
        },

        // Merge supplied values with defaults but does not change defaults.
        mergeOptions: function(d) {
            return $.extend(true, _options, d);
        },

        // Set default values.
        setDefaults: function(d) {
            _options = $.extend(true, _options, d);
            return _options;
        },

        // Set feature.properties._touched to now().  
        touch: function() {
            touch(feature);
        },

        // Bind text to feature/layer.  
        bindTexts: function(feature, layer) {
            bindTexts(feature, layer);
        },

        // Return icon for (Point) feature. 
        getIcon: function(feature) {
            return getIcon(feature);
        },

        // Return marker for (Point) feature.
        getMarker: function(feature) {
            var dummy = getDefaults();
            return getMarker(feature);
        },

        // Check for GIP-valid feature.
        // 1. It must be a geojson feature and its geometry must either by a point or a polygon.
        // 2. It must have the following properties set:
        //      2.1. properties.name
        //      2.2. properties.type
        isValidGIPGeoJSONFeature: function(feature) {
            /*
            var errs = geojsonhint.hint(feature, {
                precisionWarning: false
            });
            return errs.length == 0;
            */
            if (isSet(feature.properties) ? (isSet(feature.properties.name) && isSet(feature.properties.type)) : false) {
                return (["Point", "Polygon"].indexOf(feature.geometry.type) > -1);
            }
            console.log('Oscars.Util::isValidGIPGeoJSON: Invalid GIP feature', feature);
            return false;
        },

        versions: function() {
            console.log('L version ', L.version);
            console.log('Oscars version ', Oscars.version);
        }
    };

})();