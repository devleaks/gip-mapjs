/*
 * jQuery Oscars GIP Omap Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict"

Oscars = Oscars || {}

Oscars.Omap = (function($) {
    "use strict"
    /**
     *  DEFAULT VALUES
     */
    // Defaults as used if no default is provided
    const VERSION = "2.0.0"
    const DEFAULTS = {
        map_id: "map",
        center: [50.487729, 5.100128], // Oscars sa, Mannekenpis[50.8449933,4.3477891]
        zoom: 15,
        name: "GIP_MAP",
        display_name: "GIP Omap",
        layers: null,
        layerControl: null,
        layerControlOptions: { useGrouped: false, groupCheckboxes: true, collapsed: false },
        betterScale: true,
        track: false,
        TRACK: {
            duration: 10,
            color: '#666', //@todo: Adjust track's color from feature's
            weight: 1, //@set weight from speed or
            dashArray: "2 4" //@build dash array from speed
        },
        speedVector: false,
        sidebar: true,
        reset: true,
        map_focus_id: "map_focus_id",
        map_overview_id: "map_overview_id",
        flightboard: false,
        charts: true,
        info: true,
        info_id: "info",
        info_content_id: "device-info",
        search: false,
        wire: false,
        voice: false,
        stylesets: false,
        about: true,
        client: "oscars",
        dashboard_options: {
            elemprefix: "",
            msgprefix: "GIP-"
        }
    }

    /**
     *  PRIVATE VARIABLES
     */
    var options = {}
    var _options = false
    var _map = null
    var _mapCenter = null
    // L.Control for layers
    var _layerControl = null
    var _layerControlGrouped = false
    // Hidden layer (container) for features that need searching
    var _searchLayer = null
    // small graphs
    var _sparklines = {}
    // Track keeping
    var _speedVectorLayer = null
    var _trackLayer = null
    var _tracks = {}
    // L.Control for sidebar information
    var _sidebar = null
    var _sidebar_id = "sidebar"
    var _showInfo = false
    // layers temporary hidden through zoom level
    var _hiddenLayers = []
    // Markers that have a physical size and need adjustments on zoom changes
    var _phyMarkers = {}
    // A few statistics
    var _stats = {}
    //
    var _gipLayers = {}
    // @todo: Replace ids with random strings.
    var _dashboard = false
    //
    var _charts = {}

    var _gantt = new Map()

    var _devices = {}


    var Omap = function() {}

    Omap.prototype.init = function(options, dashboard) {
        if (_options) return _options
        if (dashboard) _dashboard = dashboard
        _options = $.extend({}, DEFAULTS)
        _options = $.extend(_options, options)
        return _options
    }

    // Generate random ID for HMTL elements
    function guidGenerator() {
        var S4 = function() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
        }
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
    }

    function showHideLayers() {
        if (!_map) return
        var doneSomething = false
        var mapZoom = _map.getZoom()
        resizeMarkers()

        // Do hidden layers need showing?
        _hiddenLayers.forEach(function(layer) {
            var indexOfHiddenLayer = _hiddenLayers.indexOf(layer)
            if (isSet(layer.options.zoom_min)) {
                if (layer.options.zoom_min <= mapZoom) {
                    if (_map.hasLayer(layer) == false) { // not necessary
                        _map.addLayer(layer)
                        if (indexOfHiddenLayer > -1) {
                            _hiddenLayers.splice(indexOfHiddenLayer, 1)
                        }
                        doneSomething = true
                    }
                }
            }
            if (isSet(layer.options.zoom_max)) {
                if (layer.options.zoom_max >= mapZoom) {
                    if (_map.hasLayer(layer) == false) { // not necessary
                        _map.addLayer(layer)
                        if (indexOfHiddenLayer > -1) {
                            _hiddenLayers.splice(indexOfHiddenLayer, 1)
                        }
                        doneSomething = true
                    }
                }
            }
        })

        // Do visible layers need hiding?
        _map.eachLayer(function(layer) {
            if (isSet(layer.options.zoom_min)) {
                if (layer.options.zoom_min > mapZoom) {
                    if (_map.hasLayer(layer)) {
                        _hiddenLayers.push(layer)
                        _map.removeLayer(layer)
                        doneSomething = true
                    }
                }
            }
            if (isSet(layer.options.zoom_max)) {
                if (layer.options.zoom_max < mapZoom) {
                    if (_map.hasLayer(layer)) {
                        _hiddenLayers.push(layer)
                        _map.removeLayer(layer)
                        doneSomething = true
                    }
                }
            }
        })

        if (doneSomething) { // provoque layer redraw
            Oscars.Util.updateSparklines()
            _map.invalidateSize()
        }
    }

    // Calculate how many meters each pixel represents
    // Used to convert physical size to pixels
    function getMetersPerPixel() {
        if (!_map) return 0;
        var y = _map.getSize().y,
            x = _map.getSize().x;
        // calculate the distance the one side of the map to the other using the haversine formula
        var maxMeters = _map.containerPointToLatLng([0, y]).distanceTo(_map.containerPointToLatLng([x, y]));
        return maxMeters / x;
    }

    // Add sidebar tab and content
    function addSidebarTab(options) {
        var content = $('<p>')
        if (!!isSet(options.nocontent) || !options.nocontent) {
            content = (isSet(options.wrap) && !options.wrap) ? options.tab_content :
                $('<div>')
                .addClass("card")
                .append($('<div>')
                    .addClass("card-body")
                    .html(options.tab_content))
        }

        var tab = document.createElement('i')
        $(tab).addClass(_options.client)
            .addClass('la')
            .addClass('la-' + options.icon)
            .append(options.icon_extra)

        _sidebar.addPanel({
            id: options.id,
            title: options.title ? options.title : "",
            tab: tab.outerHTML,
            pane: $(options.tab_content).html(),
            position: (options.hasOwnProperty("zone") && options.zone == 2) ? 'bottom' : 'top'
        })
    }

    function isSet(property) {
        return typeof property != "undefined" && (property || property === false);
    }

    function install_map() {
        var mapLoc = $('#' + _options.map_id)
        if (!mapLoc.length) {
            console.log("Omap::install_map: Error - cannot find map at #" + _options.id)
            return _map
        }

        _map = L.map(_options.map_id, {
            center: _options.center,
            zoom: _options.zoom,
            layers: _options.layers,
            zoomSnap: 0.5,
            attributionControl: false // will be displayed in sidebar
        })


        if (_options.sidebar) {
            const SIDEBARCONTENTID = "leafletsidebarcontentidcannotscroll"
            mapLoc.prepend($('<div>')
                .attr("id", _sidebar_id)
                .addClass(_options.client)
                .addClass("leaflet-sidebar")
                .addClass("collapsed")
                .append($('<div>')
                    .addClass("leaflet-sidebar-tabs")
                    .append($('<ul>')
                        .attr("role", "tablist")))
                .append($('<div id="' + SIDEBARCONTENTID + '">')
                    .addClass("leaflet-sidebar-content")))

            // see https://gis.stackexchange.com/questions/151310/leaflet-scroll-wheel-controlling-map-zoom-and-not-drop-down-menu
            var elem = L.DomUtil.get(SIDEBARCONTENTID)
            L.DomEvent.on(elem, 'mousewheel', L.DomEvent.stopPropagation)

            // Wrap elements in side bar if requested
            _sidebar = L.control.sidebar({
                container: _sidebar_id,
                position: 'right',
                closeButton: true
            }).addTo(_map)

            if (typeof _sidebar.setContent == "undefined") {
                _sidebar.setContent = function(content) {
                    var container = L.DomUtil.get(_options.info_content_id)
                    container.innerHTML = content
                }
                _sidebar.resetContent = function() {
                    _sidebar.setContent('')
                }
            }

        }

        if (!isSet(_map.options.center) && !isSet(_map.options.zoom) && isSet(_options.center) && isSet(_options.zoom)) {
            _mapCenter = {
                center: _options.center,
                zoom: _options.zoom
            }
            _map.setView(_options.center, _options.zoom)
        }

        //        _map.on('zoomend', showHideLayers)

        // Layer Control always present, may be moved to sidebar if present.
        var lclfun = L.control.layers
        if (isSet(_options.layerControlOptions) && _options.layerControlOptions.useGrouped) {
            _layerControlGrouped = true
            lclfun = L.control.groupedLayers
        }

        if (isSet(_options.layerControl)) {
            _layerControl = lclfun(_options.layerControl.baseLayers,
                _options.layerControl.overlays,
                isSet(_options.layerControl.options) ? _options.layerControl.options : _options.layerControlOptions)
        } else {
            _layerControl = lclfun(null, null, _options.layerControlOptions)
        }

        _layerControl.addTo(_map)

        _layerControl.addGipOverlay = function(layer, layerName, groupName) {
            if (_layerControlGrouped) {
                _layerControl.addOverlay(layer, layerName, groupName)
            } else {
                _layerControl.addOverlay(layer, layerName)
            }
        }


        if (_options.track) {
            _trackLayer = L.layerGroup().addTo(_map)
            _layerControl.addGipOverlay(_trackLayer, "Trails", "Trackers")
        }

        if (_options.speedVector) {
            _speedVectorLayer = L.layerGroup().addTo(_map)
            _layerControl.addGipOverlay(_speedVectorLayer, "Speed Vectors", "Trackers")
        }

        if (_options.betterScale) {
            L.control.betterscale({ metric: true, imperial: false, position: "bottomleft" }).addTo(_map) // either one or the other but not both
        } else {
            L.control.scale().addTo(_map)
        }
        _map.zoomControl.setPosition('bottomleft')

        // Add top sidebar elements
        if (_options.sidebar) {
            const LAYERCONTROLID = 'random_layer_control_id'
            addSidebarTab({
                zone: 1,
                id: "layers",
                info: "Layers",
                //              title: 'Layers<div id="themeswitch" style="float:right"><label class="switch"><input type="checkbox" onchange="toggleTheme()" id="slider"><span class="slider round"></span></label></div>',
                title: 'Layers<div class="toggle-btn" id="_1st-toggle-btn"><input id="i_1st-toggle-btn" type="checkbox" onchange="toggleTheme()"><span></span></div>',
                subtitle: "&nbsp",
                icon: "bars",
                icon_extra: null,
                tab_content: $('<div>')
                    .append($('<div>')
                        .attr("id", LAYERCONTROLID)
                        //                        .append('<div id="themeswitch" style="float:right"><label class="switch"><input type="checkbox" onchange="toggleTheme()" id="slider"><span class="slider round"></span></label></div>')
                    )
            })
            // relocate layer control to sidebar
            var newloc = document.getElementById(LAYERCONTROLID)
            newloc.appendChild(_layerControl._container)
        }

        if (_options.sidebar && _options.reset) {
            addSidebarTab({
                zone: 1,
                id: _options.map_focus_id,
                title: "Local Omap",
                info: "Center map and focus on airport",
                subtitle: "&nbsp",
                icon: "plane",
                icon_extra: null,
                tab_content: null,
                nocontent: true
            })
            addSidebarTab({
                zone: 1,
                id: _options.map_overview_id,
                title: "Area Omap",
                info: "Wide area map around airport",
                subtitle: "&nbsp",
                icon: "globe-europe",
                icon_extra: null,
                tab_content: null,
                nocontent: true
            })
        }

        if (_options.sidebar && _options.info) {
            addSidebarTab({
                zone: 1,
                id: _options.info_id,
                title: "Info",
                info: "Info",
                subtitle: "&nbsp",
                icon: "info-circle",
                icon_extra: null,
                tab_content: $('<div>')
                    .append($('<div>')
                        .attr("id", _options.info_content_id)
                        .append("Right-click/Control-click on device icon to read more information here."))

            })
            _showInfo = true
        }

        if (_options.search) {
            const SEARCHCONTROLID = 'search-control'
            addSidebarTab({
                zone: 1,
                id: "search",
                title: "Search",
                info: "Search",
                subtitle: "&nbsp",
                icon: "search",
                icon_extra: null,
                tab_content: $('<div>')
                    .append($('<div>')
                        .attr("id", SEARCHCONTROLID))
            })
            _searchLayer = L.layerGroup()
            var searchControlOptions = _options.sidebar ? {
                layer: _searchLayer,
                propertyName: "name",
                container: SEARCHCONTROLID,
                collapsed: false,
                textPlaceholder: 'Search...                ',
                marker: { icon: L.icon.pulse({ iconSize: [12, 12], color: 'red' }), animate: false, circle: false },
            } : {
                layer: _searchLayer,
                propertyName: "name",
                textPlaceholder: 'Search...                ',
                marker: { icon: L.icon.pulse({ iconSize: [12, 12], color: 'red' }), animate: false, circle: false },
            }
            _map.addControl(new L.Control.Search(searchControlOptions))
        }

        if (_options.sidebar && _options.wire) {
            addSidebarTab({ //id, title, subtitle, icon, zone, icon_extra, tab_content
                id: "messages",
                zone: 1,
                title: 'Messages<span class="clean-wire"><i class="la la-trash-o"></i>&nbsp</span>' +
                    '               <span class="sound-onoff"><i class="la"></i>&nbsp</span>',
                info: 'Wire Messages',
                subtitle: "Last Updated:&nbsp<span id='last-updated-time'>just now</span>",
                icon: "envelope",
                icon_extra: "<span id='alert-counter' class='badge " + _options.client + "'>0</span></a>",
                tab_content: $('<div>')
                    .append($('<div>')
                        .attr("id", _options.wire_options.wire_id)
                        .append($('<div>')
                            .attr("id", "gip-clock"))
                        .append($('<header>')
                            .addClass("wire-top")
                            .append($('<div>')
                                .addClass("wire-seave"))
                            .append($('<div>')
                                .addClass("wire-tagsort")
                                .append($('<div>')
                                    .addClass("tagsort-tags-container"))))
                        .append($('<div>')
                            .addClass("wire-tagsort")
                            .append($('<ul>')
                                .attr("id", "the-wire")
                                .addClass("timeline")
                                .addClass("collapse-lg")
                                .addClass("timeline-hairline")
                                .addClass("cd-timeline")))),
                wrap: false
            })

            setInterval(function() {
                var stats = Oscars.Omap.getStats()
                console.log('stats', stats)
                _dashboard.broadcast({
                    type: "wire",
                    payload: {
                        source: 'gip',
                        type: 'stats',
                        subject: 'Omap Usage Statistics',
                        body: '<pre>' + JSON.stringify(stats, null, 2) + '</pre>',
                        priority: 1,
                        icon: 'fa-bar-chart',
                        "icon-color": 'info',
                        timestamp: (new Date().getTime())
                    }
                })
            }, 600000)

        }

        // Add sidebar elements for flight boards
        if (_options.sidebar && _options.flightboard) {
            addSidebarTab({
                zone: 1,
                id: "flightboard",
                title: "Flight Boards",
                info: "Flight boards",
                subtitle: "&nbsp",
                icon: "table",
                icon_extra: null,
                tab_content: $('<div>')
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
                        .append($('<div>').html('&nbsp;'))
                    )
            })
        }

        // Add sidebar panel for charts
        if (_options.sidebar && _options.charts) {
            addSidebarTab({
                zone: 1,
                id: "charts",
                title: "Status",
                info: "Status charts",
                subtitle: "&nbsp",
                icon: "chart-pie",
                icon_extra: null,
                tab_content: $('<div>')
                    .append($('<div>')
                        .attr("id", "charts")
                        .append($('<header>')
                            .addClass("wire-top")
                            .append($('<div>')
                                .attr("id", "gip-clock-table")))
                        .append($('<div>').attr('class', 'simulated-time'))
                        .append($('<h2>').html('Apron Occupancy'))
                        .append($('<div>')
                            .append($("<div>").attr('id', 'chart-parking'))
                        )
                        .append($('<h2>').html('Arrival'))
                        .append($('<div>')
                            .append($("<div>").attr('id', 'chart-arrival'))
                        )
                        .append($('<h2>').html('Departure'))
                        .append($('<div>')
                            .append($("<div>").attr('id', 'chart-departure'))
                        )
                    )
            })
        }

        // Add sidebar panel for charts
        if (_options.sidebar && _options.charts) {
            addSidebarTab({
                zone: 1,
                id: "gantt",
                title: "Plane Services",
                info: "Plane service status",
                subtitle: "&nbsp",
                icon: "stream",
                icon_extra: null,
                tab_content: $('<div>')
                    .append($('<div>')
                        .attr("id", "gantt")
                        .append($('<header>')
                            .addClass("wire-top")
                            .append($('<div>')
                                .attr("id", "gip-clock-table")))
                        .append($('<div>').attr('class', 'simulated-time'))
                        .append($('<div>').attr('id', 'gantt-content'))
                    )
            })
        }

        // Add bottom of sidebar elements
        if (_options.sidebar && _options.stylesets) {
            addSidebarTab({
                zone: 2,
                id: "settings",
                title: "Preferences",
                info: "Preferences",
                subtitle: "&nbsp",
                icon: "gear",
                icon_extra: null,
                tab_content: $('<div>')
                    .append($('<form>')
                        .addClass("form")
                        .append($('<label>')
                            .attr("for", "styleselect")
                            .addClass("form-control")
                            .html("Style set&nbsp:&nbsp&nbsp"))
                        .append($('<select>')
                            .attr("id", "styleselect")
                            .attr("name", "styleset")
                            .addClass("form-control")))
            })
            for (var opt in _options.stylesets) {
                if (_options.stylesets.hasOwnProperty(opt)) {
                    $('#styleselect').append( //<option value="DEFAULT" selected>Default</option>
                        $('<option>').attr('value', opt).html(_options.stylesets[opt])
                    )
                }
            }
        }

        if (_options.sidebar && _options.about) {
            var aboutOptions = {
                zone: 2,
                id: "about",
                title: "About Oscars GIP Viewer",
                info: "About Oscars GIP Viewer",
                subtitle: "&nbsp",
                icon: null,
                icon_extra: '<span class="about ' + _options.client + '" title="About GIP..."></span>',
                tab_content: '<div class="card" style="text-align: center">' +
                    '   <div class="card-body">' +
                    '       <div class="la-logo"></div>' +
                    '   </div>' +
                    '   <div class="card-body">' +
                    '       <div class="gip-logo"></div>' +
                    '   </div>' +
                    '   <div>' +
                    '       <header>Our map is using these libraries:</header>' +
                    '   </div>' +
                    '   <div class="card-body">' +
                    '       <table class="oscars-credits">' +
                    '<tr>' +
                    '   <td><div class="leafletjs-logo"></div></td>' +
                    '   <td>A JavaScript library for interactive maps.</td>' +
                    '</tr>' +
                    '<tr>' +
                    '   <td><div class="mapbox-logo"></div></td>' +
                    '   <td>The location platform for developers and designers.</td>' +
                    '</tr>' +
                    '<tr>' +
                    '   <td><div class="osm-logo"></div></td>' +
                    '   <td>A map of the world, created by people, and free to use under an open license.</td>' +
                    '</tr>' +
                    '<tr>' +
                    '   <td><div class="stamen-logo"></div></td>' +
                    '   <td>A library of awesome styles for OpenStreetOmap data.</td>' +
                    '</tr>' +
                    '<tr>' +
                    '   <td><div class="stadia-logo"></div></td>' +
                    '   <td>Stadia Omaps: Location made human.</td>' +
                    '</tr>' +
                    '       </table>' +
                    '   </div>' +
                    '</div>' +
                    '<div style="font-size: smallermargin-top:20pxtext-align:center">' +
                    '   &copy ' + (new Date()).getFullYear() + ' — Oscars s.a. and respective lisensees.' +
                    '</div>',
                wrap: false
            }
            addSidebarTab(aboutOptions)
        }

        install_handlers(_options)

        if (_options.sidebar && _options.charts) {
            install_charts()
        }

        // must be done last
        var resetloc = $('.leaflet-sidebar-tabs a[href="#' + _options.map_focus_id + '"]')
        if (resetloc.length > 0) {
            resetloc.click(function(event) {
                event.preventDefault()
                Oscars.Omap.resetLocation(false)
            })
        }

        var overviewloc = $('.leaflet-sidebar-tabs a[href="#' + _options.map_overview_id + '"]')
        if (overviewloc.length > 0) {
            overviewloc.click(function(event) {
                event.preventDefault()
                Oscars.Omap.resetLocation(true)
            })
        }

        if (_options.debug) {
            run_tests()
        }

        dashboard.broadcast({
            type: "wire",
            payload: {
                source: 'gip',
                type: 'news',
                subject: 'GIP Omap ready.',
                body: "Omap initialized and ready",
                priority: 2,
                icon: 'fa-info',
                "icon-color": 'success',
                timestamp: Date.now(),
                speak: false
            }
        })

        return _map
    } // install_map()


    // returns a structure ready for chart update
    function getServices(parking) { // force key to string
        const colors = {
            plane: "#db2004",
            fuel: '#008FFB',
            catering: '#00E396',
            sewage: '#775DD0',
            cargo: '#FEB019',
            default: '#FF4560'
        }
        var r = _gantt.get('' + parking)
        console.log("getServices::r", r)
        var now = moment()
        var data = [],data2,
            arrt = false,
            dept = false

        if (r.arrival) {
            arrt = moment(r.arrival.scheduled).subtract(60, "minutes")
            if (r.departure) {
                dept = moment(r.arrival.scheduled).add(60, "minutes")
            }
        }

        if (arrt && dept) {
            data.push({
                x: "Plane OO-123",
                y: [arrt.valueOf(), dept.valueOf()],
                fillColor: colors["plane"]
            })
        }

        if (r) {
            for (var service in r.services) {
                if (r.services.hasOwnProperty(service)) {
                    var s = r.services[service]
                    for (var vehicle in s) {
                        if (s.hasOwnProperty(vehicle)) {
                            var v = s[vehicle]
                            var e = v.firstseen == v.lastseen ? 20 * 60 * 1000 : 0
                            data.push({
                                x: service,
                                y: [v.firstseen, v.lastseen + e],
                                fillColor: colors[service]
                            })
                        }
                    }
                }
            }
        }

        // console.log("getServices::data", data)

        data2 = [{
                    x: 'Plane',
                    y: [
                        arrt.valueOf(),
                        dept.valueOf()
                    ],
                    fillColor: '#008FFB'
                },
                {
                    x: 'Deboarding',
                    y: [
                        moment(now).subtract(40, "minutes").valueOf(),
                        moment(now).subtract(5, "minutes").valueOf()
                    ],
                    fillColor: '#008FFB'
                },
                {
                    x: 'Fuel',
                    y: [
                        moment(now).subtract(15, "minutes").valueOf(),
                        moment(now).add(15, "minutes").valueOf()
                    ],
                    fillColor: '#00E396'
                },
                {
                    x: 'Catering',
                    y: [
                        moment(now).subtract(25, "minutes").valueOf(),
                        moment(now).add(1, "minutes").valueOf()
                    ],
                    fillColor: '#775DD0'
                },
                {
                    x: 'Boarding',
                    y: [
                        moment(now).add(15, "minutes").valueOf(),
                        moment(now).add(45, "minutes").valueOf()
                    ],
                    fillColor: '#FEB019'
                },
                {
                    x: 'Cleaning',
                    y: [
                        moment(now).subtract(25, "minutes").valueOf(),
                        moment(now).add(10, "minutes").valueOf()
                    ],
                    fillColor: '#FF4560'
                }
            ]

        // console.log("getServices::returned", data)

        return [{
            data: data
        }];

    }


    function createGanttChart(parking) {
        var chartname = "gantt-" + parking
        var data = getServices(parking)

        // Create chart entry:
        $('#gantt-content')
            .append($('<div>')
                .append($('<h3>').html("Parking " + parking))
                .append($('<div>')
                    .append($("<div>").attr('id', 'chart-' + chartname))
                )
            )

        _charts[chartname] = new ApexCharts(document.querySelector("#chart-" + chartname), {
            series: data,
            chart: {
                height: 150,
                type: 'rangeBar'
            },
            plotOptions: {
                bar: {
                    horizontal: true,
                    distributed: true,
                    dataLabels: {
                        hideOverflowingLabels: false
                    }
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function(val, opts) {
                    var label = opts.w.globals.labels[opts.dataPointIndex]
                    var a = moment(val[0])
                    var b = moment(val[1])
                    var diff = moment.duration(b.diff(a)).humanize()
                    return label + ': ' + diff
                },
                style: {
                    colors: ['#f3f4f5', '#fff']
                }
            },
            xaxis: {
                type: 'datetime'
            },
            yaxis: {
                show: false
            },
            grid: {
                row: {
                    colors: ['#f3f4f5', '#fff'],
                    opacity: 1
                }
            }
        })
        _charts[chartname].render()
    }


    function updateGanttChart(parking) {
        var chartname = "gantt-" + parking
        var data = getServices(parking)
        _charts[chartname].updateSeries(data)
    }


    function install_charts() {
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


    /*
    gantt object: key: parking: A51 = {
        from: {
            name: ,
            airport: ,
            scheduled: ,
            planned: ,
            actual: ,
            note: ,
            isnew: ,
            removeAt:
        },
        to: {
            name: ,
            airport: ,
            scheduled: ,
            planned: ,
            actual: ,
            note: ,
            isnew: ,
            removeAt:
        },
        services: [{
                vehicle: fuel01,
                type: fuel,
                firstseen: "2020-04-29T16:51:23.000+02:00",
                lastseen: "2020-04-29T17:21:54.000+02:00",
                status: "service"
                "left"
                "arrived" ?
            },
            {
                vehicle: catering01,
                type: catering,
                firstseen: "2020-04-29T16:51:23.000+02:00",
                lastseen: "2020-04-29T16:51:23.000+02:00",
                status: "arrived"
            }
        ]
    }

    */
    // creates a chart for a new parking arrival
    function createGantt(parking) {
        const flight = Oscars.Util.getFlight(parking.flight)
        const departure = Oscars.Util.getDepartureFlight(parking.flight)
        var r = _gantt.get('' + parking.name)
        if (!r) { // we see a service vehicle before the plane, we need to record it...
            _gantt.set('' + parking.name, { // force key to string
                arrival: flight,
                departure: departure,
                services: {}
            })
            createGanttChart(parking.name)
        } else { // there is already a service vehicle that arrived on the parking before the place...
            if (flight) {
                console.log("createGantt", "plane arrived after service?", parking)
                r.arrival = flight
            }
            if (departure) {
                console.log("createGantt", "plane arrived after service, has departure", parking)
                r.departure = departure
            }
            updateGanttChart(parking.name)
        }
    }

    // record a stopped event and update the chart
    function updateGantt(stopped) {
        if (stopped.feature.properties.type == "SERVICE") {
            const vehicle = stopped.feature.id
            const sarr = vehicle.split(':') // id = "catering:0"
            const service = sarr[0]
            var r = _gantt.get('' + stopped.parking)
            var create = false

            if (!r) { // we see a service vehicle before the plane, we need to record it...
                r = {
                    services: {}
                }
                create = true
                console.log("updateGantt", "service arrived before plane?", stopped)
            }

            if (!r.departure) {
                if (r.arrival) {
                    console.log("updateGantt", "service has arrival", r, stopped)
                    r.departure = Oscars.Util.getDepartureFlight(r.arrival.name)
                    if (r.departure) {
                        console.log("updateGantt", "service has departure", r, stopped)
                    }
                } else {
                    console.log("updateGantt", "service has no flight assigned", r, stopped)
                }
            }

            r.services[service] = r.services.hasOwnProperty(service) ?
                r.services[service] : {}
            var thisservice = r.services[service]

            thisservice[vehicle] = thisservice.hasOwnProperty(vehicle) ?
                thisservice[vehicle] : {}

            var thisvehicle = thisservice[vehicle]

            console.log("updateGantt", moment().valueOf(), stopped.feature)

            if (!thisvehicle.hasOwnProperty("firstseen")) {
                // console.log("updateGantt: First visit...", moment(stopped.feature.properties._timestamp_emission, moment.ISO_8601).valueOf(), stopped.feature)
                // console.log("updateGantt: First visit...", StackTrace.getSync())
                thisvehicle.firstseen = moment(stopped.feature.properties._timestamp_emission, moment.ISO_8601).valueOf()
            } else {
                console.log("updateGantt: Second visit...", thisvehicle.firstseen, moment(stopped.feature.properties._timestamp_emission, moment.ISO_8601).valueOf(), stopped.feature)
                // console.log("updateGantt: Second visit...", StackTrace.getSync())
            }
            thisvehicle.lastseen = moment(stopped.feature.properties._timestamp_emission, moment.ISO_8601).valueOf()

            // do we need to push r back on map??
            _gantt.set('' + stopped.parking, r)

            if (create)
                createGanttChart(stopped.parking)
            else
                updateGanttChart(stopped.parking)
        }
    }


    function install_handlers() {
        $("#" + _options.dashboard_options.elemprefix + _options.map_id).on(_options.dashboard_options.msgprefix + _options.map_message, function(event, feature) {
            // we need to find which layer to update.
            // the layer is supplied through the *_group name property.
            //console.log('L.Oscars::gip:update: Info - ', feature)
            if (_options.debug)
                console.log("Omap::on", feature)
            if (feature.properties && feature.properties.group_name) {
                var layer = Oscars.Omap.findGIPLayer(feature.properties.group_name)
                if (layer) {
                    const fid = Oscars.Util.getFeatureId(feature)
                    var oldf = _devices.hasOwnProperty(fid) ? _devices[fid] : false
                    layer.update(feature)

                    if (feature.properties.hasOwnProperty("speed") && feature.properties.speed == 0) {
                        //console.log("Omap::trigger:stopped", feature)
                        $("#" + _options.dashboard_options.elemprefix + _options.map_id).trigger(_options.dashboard_options.msgprefix + "stopped", { feature: feature })
                    }
                    if (oldf && oldf.properties.hasOwnProperty("speed")) {
                        // console.log("oldf", fid, oldf.properties.speed, feature.properties.speed)
                        if (oldf.properties.speed > 0 && feature.properties.speed == 0) { // device has stopped
                            $("#" + _options.dashboard_options.elemprefix + _options.map_id).trigger(_options.dashboard_options.msgprefix + "just-stopped", { feature: feature })
                        } else if (oldf.properties.speed == 0 && feature.properties.speed > 0) {
                            $("#" + _options.dashboard_options.elemprefix + _options.map_id).trigger(_options.dashboard_options.msgprefix + "just-started", { feature: feature })
                        } else if (oldf.properties.speed == 0 && feature.properties.speed == 0 &&
                            turf.distance(oldf.geometry.coordinates, feature.geometry.coordinates, { units: 'kilometers' }) > 0.05) { // still stopped but moved 50 meters
                            $("#" + _options.dashboard_options.elemprefix + _options.map_id).trigger(_options.dashboard_options.msgprefix + "just-moved", { feature: feature })
                        }
                    }
                    _devices[fid] = feature
                } else {
                    console.log("Omap::gip:update: Warning - Cannot find GIP layer", feature)
                }
            } else {
                console.log("Omap::gip:update: Warning - Feature has no group name", feature)
            }
        })
        if (_options.debug)
            console.log("Omap::install_handlers: added", "#" + _options.dashboard_options.elemprefix + _options.map_id, _options.dashboard_options.msgprefix + _options.map_message)
    } // install_handlers()

    function run_tests() {
        L.marker(_options.center, { icon: L.icon.pulse({ iconSize: [10, 10], color: 'red' }) }).addTo(_map);
    }

    /**
     *  PUBLIC INTERFACE
     */
    return {
        map: function(options, dashboard = false) {
            Omap.prototype.init(options) // creates _options
            var map = install_map()
            if (dashboard)
                dashboard.register(_options.map_id, _options.map_message)
            return map
        },

        createGantt: function(parking) {
            createGantt(parking)
        },

        updateGantt: function(stopped) {
            updateGantt(stopped)
        },

        deleteGantt: function(parking) {
            const chartname = "gantt-" + parking.name
            //$('#chart-' + chartname).parent().parent().remove()
            if (_charts.hasOwnProperty(chartname)) {
                delete _charts[chartname]
            }
            _gantt.delete('' + parking.name)
        },

        resetLocation: function(mode) {
            if (isSet(_mapCenter)) {
                if (mode) {
                    _map.setView(_mapCenter.center, 8)
                } else {
                    _map.setView(_mapCenter.center, _mapCenter.zoom)
                }
            } else if (isSet(_map.options.center) && isSet(_map.options.zoom)) {
                if (mode) {
                    _map.setView(_map.options.center, 8)
                } else {
                    _map.setView(_map.options.center, _map.options.zoom)
                }
            }
            if (_sidebar)
                _sidebar.close()
        },

        findGIPLayer: function(name) {
            return _gipLayers[name]
        },

        updateChart: function(chartname, data, total = 0) {
            if (_charts.hasOwnProperty(chartname)) {
                _charts[chartname].updateSeries(data)
                if (chartname == "parking") {
                    _charts[chartname].updateOptions({
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
            }
        },

        // Adds a layer to the supplied control layer. If the device/zone groups has a "grouping category", places it in,
        // otherwise, uses generic Devices/Zones groups.
        addLayerToControlLayer: function(featureCollection, layer) {
            var layer_group_display_name, display_name, name
            if (featureCollection.type == "FeatureCollection") {
                var type = "Devices"
                if (featureCollection.features.length > 0) {
                    type = (featureCollection.features[0].geometry.type == "Point") ? "Devices" : "Zones"
                }
                layer_group_display_name = isSet(featureCollection.properties) && isSet(featureCollection.properties.layer_group_display_name) ? featureCollection.properties.layer_group_display_name : type
                display_name = featureCollection.properties.display_name
                name = featureCollection.properties.name
            } else if (Array.isArray(featureCollection) && featureCollection.length > 0) { // collections of features gets the name of the type of the first element
                layer_group_display_name = (featureCollection[0].geometry.type == "Point") ? "Devices" : "Zones"
                display_name = isSet(featureCollection[0].properties.display_type) ? featureCollection[0].properties.display_type : featureCollection[0].properties.type
                name = isSet(featureCollection[0].properties.group_name) ? featureCollection[0].properties.group_name : null
            } else { // layers from one element gets the name from that element
                layer_group_display_name = (featureCollection.geometry.type == "Point") ? "Devices" : "Zones"
                display_name = featureCollection.properties.display_name
                name = featureCollection.properties.name
            }
            if (_layerControl) {
                _layerControl.addGipOverlay(layer, display_name, layer_group_display_name)
                if (name) {
                    // console.log('Omap::addLayerToControlLayer: Info - Adding', name)
                    _gipLayers[name] = layer
                } else {
                    console.log('Omap::addLayerToControlLayer: featureCollection has no group name', featureCollection)
                }
            } else {
                console.log('Omap::addLayerToControlLayer: _layerControl not set', featureCollection)
            }
        },

        setSidebarContent: function(content) {
            _sidebar.setContent(content)
            _sidebar.open(_options.info_id)
        },

        addToSearch: function(layer) {
            if (_searchLayer) {
                _searchLayer.addLayer(layer)
            }
        },

        // Returns serach layer to add/remove layers.
        searchLayer: function() {
            return _searchLayer
        },

        track: function(feature) { //@todo: When removing feature, remove its track by calling untrack
            if (_trackLayer) {
                if (feature.geometry.type != "Point") return
                if (!isSet(_tracks[feature.properties.name])) {
                    _tracks[feature.properties.name] = L.polyline([getLatLng(feature)], _options.TRACK)
                    _trackLayer.addLayer(_tracks[feature.properties.name])
                } else {
                    var ll = _tracks[feature.properties.name].getLatLngs()
                    if (ll.length > _options.TRACK.duration) {
                        ll.splice(0, 1)
                        _tracks[feature.properties.name].setLatLngs(ll)
                    }
                    _tracks[feature.properties.name].addLatLng(getLatLng(feature))
                }
            }
        },

        untrack: function(feature) {
            if (_trackLayer && isSet(_tracks[feature.properties.name])) {
                _trackLayer.removeLayer(_tracks[feature.properties.name])
                delete _tracks[feature.properties.name]
            }
        },

        vector: function(v, layer) {
            if (v && _speedVectorLayer) {
                layer.on("add", function(e) {
                        if (this.options.vector) this.options.vector.addTo(_speedVectorLayer);
                    })
                    .on("remove", function(e) {
                        if (this.options.vector) {
                            _speedVectorLayer.removeLayer(this.options.vector);
                            delete this.options.vector;
                        }
                    });
            }
        },


        setStats: function(statname) {
            if (typeof _stats[statname] == "undefined") {
                _stats[statname] = 0
            }
            _stats[statname]++
        },

        getStats: function() {
            var features = {}
            _map.eachLayer(function(layer) {
                if (layer instanceof L.GeoJSON) {
                    var fc = layer.toGeoJSON()
                    features[L.Util.stamp(layer)] = fc.features.length
                }
            })

            return {
                features: features,
                updates: _stats,
                timestamp: (new Date().getTime())
            }
        },

        addDeviceGroup: function(featureCollection, options) {
            var l = L.Oscars.deviceGroup(featureCollection, options)
            // l.addTo(this._map)
            Oscars.Omap.addLayerToControlLayer(featureCollection, l)
            return l
        },

        addZoneGroup: function(featureCollection, options) {
            var l = L.Oscars.zoneGroup(featureCollection, options)
            // l.addTo(this._map)
            Oscars.Omap.addLayerToControlLayer(featureCollection, l)
            return l
        },

        versions: function() {
            console.log('L version ', L.version)
            console.log('L.Oscars version ', L.Oscars.version)
        }
    }

})(jQuery)