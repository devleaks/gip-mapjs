/*
 * jQuery Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 *
 *  Leaflet map for Oscars GIP.
 */
"use strict"
const VERSION = "5.0.0"
const MODULE_NAME = "Omap"

import * as Util from './O-utils.js'

/**
 *  DEFAULT VALUES
 */
const DEFAULTS = {
    elemid: "map",
    msgtype: "map",

    center: [50.487729, 5.100128], // Oscars sa, Mannekenpis[50.8449933,4.3477891]

    zoom: 15,
    layers: null,

    layerControl: {
        baseLayers: null,
        overlays: null,
        options: { groupCheckboxes: true, collapsed: false }
    },
    layerControlOptions: { useGrouped: true, groupCheckboxes: true, collapsed: false },

    betterScale: true,

    track: false, // @todo: should move to layer
    speedVector: false,

    sidebar: false,




    debug: false
}

/**
 *  PRIVATE VARIABLES
 */
var _options = false
var _dashboard = false

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
// layers temporary hidden through zoom level
var _hiddenLayers = []
// Markers that have a physical size and need adjustments on zoom changes
var _phyMarkers = {}
// A few statistics
var _stats = {}
//
var _gipLayers = {}
// @todo: Replace ids with random strings.
//
var _charts = {}


/**
 *  PRIVATE FUNCTIONS
 */


function init(options, dashboard) {
    if (_options)
        return _options

    _options = Util.extend(DEFAULTS, options)

    if (dashboard) {
        _dashboard = dashboard
    }

    _map = install_hmtl()
    install_handlers()

    return _options
}

function showHideLayers() {
    if (!_map) return
    var doneSomething = false
    var mapZoom = _map.getZoom()
    resizeMarkers()

    // Do hidden layers need showing?
    _hiddenLayers.forEach(function(layer) {
        var indexOfHiddenLayer = _hiddenLayers.indexOf(layer)
        if (Util.isSet(layer.options.zoom_min)) {
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
        if (Util.isSet(layer.options.zoom_max)) {
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
        if (Util.isSet(layer.options.zoom_min)) {
            if (layer.options.zoom_min > mapZoom) {
                if (_map.hasLayer(layer)) {
                    _hiddenLayers.push(layer)
                    _map.removeLayer(layer)
                    doneSomething = true
                }
            }
        }
        if (Util.isSet(layer.options.zoom_max)) {
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

function install_sidebar() {
    // Add sidebar tab and content
    function addSidebarTab(options) {
        if (_options.sidebar) {
            var content = $('<p>')
            if (!!Util.isSet(options.nocontent) || !options.nocontent) {
                content = (Util.isSet(options.wrap) && !options.wrap) ? options.tab_content :
                    $('<div>')
                    .addClass("card")
                    .append($('<div>')
                        .addClass("card-body")
                        .html(options.tab_content))
            }

            var tab = document.createElement('i')
            $(tab).addClass("client")
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
    }

    var mapLoc = $('#' + _options.elemid)

    if (!_options.sidebar.elemid) {
        console.log(MODULE_NAME + "::install_html: no sidebar id provided")
        return
    }

    const SIDEBARCONTENTID = _options.sidebar.elemid + "_ocontent"

    mapLoc.prepend($('<div>')
        .attr("id", _options.sidebar.elemid)
        .addClass("client")
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
        container: _options.sidebar.elemid,
        position: 'right',
        closeButton: true
    }).addTo(_map)

    // Add top sidebar elements
    const LAYERCONTROLID = _options.sidebar.elemid + "_olayercontrol"
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
                //.append('<div id="themeswitch" style="float:right"><label class="switch"><input type="checkbox" onchange="toggleTheme()" id="slider"><span class="slider round"></span></label></div>')
            )
    })
    // relocate layer control to sidebar
    var newloc = document.getElementById(LAYERCONTROLID)
    newloc.appendChild(_layerControl._container)


    const MAPFOCUS = _options.sidebar.elemid + "_omapfocus"
    const MAPOVERVIEW = _options.sidebar.elemid + "_omapoverview"
    if (_options.sidebar.reset) {
        addSidebarTab({
            zone: 1,
            id: MAPFOCUS,
            title: "Local Map",
            info: "Center map and focus on airport",
            subtitle: "&nbsp",
            icon: "plane",
            icon_extra: null,
            tab_content: null,
            nocontent: true
        })
        addSidebarTab({
            zone: 1,
            id: MAPOVERVIEW,
            title: "Area Map",
            info: "Wide area map around airport",
            subtitle: "&nbsp",
            icon: "globe-europe",
            icon_extra: null,
            tab_content: null,
            nocontent: true
        })
    }

    const MAPINFO = _options.sidebar.elemid + "_oinfo"
    const MAPINFOCONTENT = _options.sidebar.elemid + "_oinfocontent"
    if (_options.sidebar.info) {
        addSidebarTab({
            zone: 1,
            id: MAPINFO,
            title: "Info",
            info: "Info",
            subtitle: "&nbsp",
            icon: "info-circle",
            icon_extra: null,
            tab_content: $('<div>')
                .append($('<div>')
                    .attr("id", MAPINFOCONTENT)
                    .append("Right-click/Control-click on device icon to read more information here."))

        })
        if (typeof _sidebar.setContent == "undefined") {
            _sidebar.setContent = function(content) {
                var container = L.DomUtil.get(MAPINFOCONTENT)
                container.innerHTML = content
            }
            _sidebar.resetContent = function() {
                _sidebar.setContent('')
            }
        }

    }

    if (_options.sidebar.search) {
        const SEARCHCONTROLID = _options.sidebar.elemid + "_osearchcontrol"
        addSidebarTab({
            zone: 1,
            id: _options.sidebar.elemid + "_osearch",
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
        var searchControlOptions = _options.sidebar ? { // move it to sidebar
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

    if (_options.sidebar.wire) {
        console.log("wire", _options.sidebar.wire.getElemId())
        addSidebarTab({ //id, title, subtitle, icon, zone, icon_extra, tab_content
            id: _options.sidebar.wire.getElemId(),
            zone: 1,
            title: 'Messages<span class="clean-wire"><i class="la la-trash-o"></i>&nbsp</span>' +
                '               <span class="sound-onoff"><i class="la"></i>&nbsp</span>',
            info: 'Wire Messages',
            subtitle: "Last Updated:&nbsp<span id='last-updated-time'>just now</span>",
            icon: "envelope",
            icon_extra: "<span id='alert-counter' class='badge client'>0</span></a>",
            tab_content: _options.sidebar.wire.getTemplate(),
            wrap: false
        })

        setInterval(function() {
            var stats = Oscars.Map.getStats()
            console.log('stats', stats)
            _dashboard.broadcast({
                type: "wire",
                payload: {
                    source: 'gip',
                    type: 'stats',
                    subject: 'Map Usage Statistics',
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
    if (_options.sidebar.flightboard) {
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
                )
        })
    }

    // Add sidebar panel for charts
    if (_options.sidebar.charts) {
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

    // Add bottom of sidebar elements
    if (_options.sidebar.stylesets) {
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

    if (_options.sidebar.about) {
        var aboutOptions = {
            zone: 2,
            id: "about",
            title: "About Oscars GIP Viewer",
            info: "About Oscars GIP Viewer",
            subtitle: "&nbsp",
            icon: null,
            icon_extra: '<span class="about client" title="About GIP..."></span>',
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
                '   <td>A library of awesome styles for OpenStreetMap data.</td>' +
                '</tr>' +
                '<tr>' +
                '   <td><div class="stadia-logo"></div></td>' +
                '   <td>Stadia Maps: Location made human.</td>' +
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

    // must be done last
    var resetloc = $('.leaflet-sidebar-tabs a[href="#' + MAPFOCUS + '"]')
    if (resetloc.length > 0) {
        resetloc.click(function(event) {
            event.preventDefault()
            resetLocation(false)
        })
    }

    var overviewloc = $('.leaflet-sidebar-tabs a[href="#' + MAPOVERVIEW + '"]')
    if (overviewloc.length > 0) {
        overviewloc.click(function(event) {
            event.preventDefault()
            resetLocation(true)
        })
    }

    console.log(MODULE_NAME + "::install_sidebar", "done")
}


function install_hmtl() {
    var mapLoc = $('#' + _options.elemid)
    if (!mapLoc.length) {
        console.log(MODULE_NAME + "::install_map: Error - cannot find map at #" + _options.id)
        return _map
    }

    _map = L.map(_options.elemid, {
        center: _options.center,
        zoom: _options.zoom,
        layers: _options.layers,
        zoomSnap: 0.5,
        attributionControl: false // will be displayed in sidebar
    })


    if (!Util.isSet(_map.options.center) && !Util.isSet(_map.options.zoom) && Util.isSet(_options.center) && Util.isSet(_options.zoom)) {
        _mapCenter = {
            center: _options.center,
            zoom: _options.zoom
        }
        _map.setView(_options.center, _options.zoom)
    }

    //        _map.on('zoomend', showHideLayers)

    // Layer Control always present, may be moved to sidebar if present.
    var lclfun = L.control.layers
    if (Util.isSet(_options.layerControlOptions) && _options.layerControlOptions.useGrouped) {
        _layerControlGrouped = true
        lclfun = L.control.groupedLayers
    }

    if (Util.isSet(_options.layerControl)) {
        _layerControl = lclfun(_options.layerControl.baseLayers,
            _options.layerControl.overlays,
            Util.isSet(_options.layerControl.options) ? _options.layerControl.options : _options.layerControlOptions)
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


    if (_options.betterScale) {
        L.control.betterscale({ metric: true, imperial: false, position: "bottomleft" }).addTo(_map) // either one or the other but not both
    } else {
        L.control.scale().addTo(_map)
    }
    _map.zoomControl.setPosition('bottomleft')


    if (_options.track) {
        _trackLayer = L.layerGroup().addTo(_map)
        _layerControl.addGipOverlay(_trackLayer, "Trails", "Trackers")
    }

    if (_options.speedVector) {
        _speedVectorLayer = L.layerGroup().addTo(_map)
        _layerControl.addGipOverlay(_speedVectorLayer, "Speed Vectors", "Trackers")
    }

    if (_options.sidebar) {
        install_sidebar()
    }

    if (_options.debug) {
        run_tests()
    }

    _dashboard.broadcast({
        type: "wire",
        payload: {
            source: 'gip',
            type: 'news',
            subject: 'GIP Map ready.',
            body: "Map initialized and ready",
            priority: 2,
            icon: 'fa-info',
            "icon-color": 'success',
            timestamp: Date.now(),
            speak: false
        }
    })

    return _map
} // install_map()


function install_handlers() {
    _dashboard.register(_options.elemid, _options.msgtype)
    $("#" + _dashboard.getElemPrefix() + _options.elemid).on(_dashboard.getMessagePrefix() + _options.msgtype, function(event, feature) {
        // we need to find which layer to update.
        // the layer is supplied through the *_group name property.
        //console.log('L.Oscars::gip:update: Info - ', feature)
        if (_options.debug)
            console.log(MODULE_NAME + "::on", feature)
        if (feature.properties && feature.properties.group_name) {
            var layer = Oscars.Map.findGIPLayer(feature.properties.group_name)
            if (layer) {
                layer.update(feature)
            } else {
                console.log(MODULE_NAME + "::gip:update: Warning - Cannot find GIP layer", feature)
            }
        } else {
            console.log(MODULE_NAME + "::gip:update: Warning - Feature has no group name", feature)
        }
    })
} // install_handlers()

function run_tests() {
    L.marker(_options.center, { icon: L.icon.pulse({ iconSize: [10, 10], color: 'red' }) }).addTo(_map);
}

/**
 *  PUBLIC INTERFACE
 */
function getMap() {
    return _options ? _map : false
}

function resetLocation(mode) {
    if (Util.isSet(_mapCenter)) {
        if (mode) {
            _map.setView(_mapCenter.center, 8)
        } else {
            _map.setView(_mapCenter.center, _mapCenter.zoom)
        }
    } else if (Util.isSet(_map.options.center) && Util.isSet(_map.options.zoom)) {
        if (mode) {
            _map.setView(_map.options.center, 8)
        } else {
            _map.setView(_map.options.center, _map.options.zoom)
        }
    }
    if (_sidebar)
        _sidebar.close()
}

function findGIPLayer(name) {
    return _gipLayers[name]
}

// Adds a layer to the supplied control layer. If the device/zone groups has a "grouping category", places it in,
// otherwise, uses generic Devices/Zones groups.
function addLayerToControlLayer(featureCollection, layer) {
    var layer_group_display_name, display_name, name
    if (featureCollection.type == "FeatureCollection") {
        var type = "Devices"
        if (featureCollection.features.length > 0) {
            type = (featureCollection.features[0].geometry.type == "Point") ? "Devices" : "Zones"
        }
        layer_group_display_name = Util.isSet(featureCollection.properties) && Util.isSet(featureCollection.properties.layer_group_display_name) ? featureCollection.properties.layer_group_display_name : type
        display_name = featureCollection.properties.display_name
        name = featureCollection.properties.name
    } else if (Array.isArray(featureCollection) && featureCollection.length > 0) { // collections of features gets the name of the type of the first element
        layer_group_display_name = (featureCollection[0].geometry.type == "Point") ? "Devices" : "Zones"
        display_name = Util.isSet(featureCollection[0].properties.display_type) ? featureCollection[0].properties.display_type : featureCollection[0].properties.type
        name = Util.isSet(featureCollection[0].properties.group_name) ? featureCollection[0].properties.group_name : null
    } else { // layers from one element gets the name from that element
        layer_group_display_name = (featureCollection.geometry.type == "Point") ? "Devices" : "Zones"
        display_name = featureCollection.properties.display_name
        name = featureCollection.properties.name
    }
    if (_layerControl) {
        _layerControl.addGipOverlay(layer, display_name, layer_group_display_name)
        if (name) {
            // console.log('Map::addLayerToControlLayer: Info - Adding', name)
            _gipLayers[name] = layer
        } else {
            console.log('Map::addLayerToControlLayer: featureCollection has no group name', featureCollection)
        }
    } else {
        console.log('Map::addLayerToControlLayer: _layerControl not set', featureCollection)
    }
}

function setSidebarContent(content) {
    if (_sidebar && _sidebar.hasOwnProperty("setContent")) {
        _sidebar.setContent(content)
        _sidebar.open(_options.info_id)
    }
}

function addToSearch(layer) {
    if (_searchLayer) {
        _searchLayer.addLayer(layer)
    }
}

// Returns serach layer to add/remove layers.
function searchLayer() {
    return _searchLayer
}

function track(feature) { //@todo: When removing feature, remove its track by calling untrack
    if (_trackLayer) {
        if (feature.geometry.type != "Point") return
        if (!Util.isSet(_tracks[feature.properties.name])) {
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
}

function untrack(feature) {
    if (_trackLayer && Util.isSet(_tracks[feature.properties.name])) {
        _trackLayer.removeLayer(_tracks[feature.properties.name])
        delete _tracks[feature.properties.name]
    }
}

function vector(v, layer) {
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
}


function setStats(statname) {
    if (typeof _stats[statname] == "undefined") {
        _stats[statname] = 0
    }
    _stats[statname]++
}

function getStats() {
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
}

function addDeviceGroup(featureCollection, options) {
    var l = L.Oscars.deviceGroup(featureCollection, options)
    // l.addTo(this._map)
    Oscars.Map.addLayerToControlLayer(featureCollection, l)
    return l
}

function addZoneGroup(featureCollection, options) {
    var l = L.Oscars.zoneGroup(featureCollection, options)
    // l.addTo(this._map)
    Oscars.Map.addLayerToControlLayer(featureCollection, l)
    return l
}

/**
 *  MODULE EXPORTS
 */
function version() {
    console.log('L version ', L.version)
    console.log(MODULE_NAME, VERSION);
}

export {
    init,
    version,
    getMap
}