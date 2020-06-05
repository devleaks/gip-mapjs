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
    zoom_overview: 8,

    layers: null,

    layerControl: {
        baseLayers: null,
        overlays: null,
        options: { groupCheckboxes: true, collapsed: false }
    },
    layerControlOptions: { useGrouped: true, groupCheckboxes: true, collapsed: false },

    betterScale: true,

    sidebar: {
        map_elemid: "map"
    },

    themes: {
        dark: [],
        light: []
    },

    debug: false
}

/**
 *  PRIVATE VARIABLES
 */
var _options = false
var _dashboard = false

var _map = null

// L.Control for layers
var _layerControl = null
var _layerControlGrouped = false

// A few statistics
var _stats = {}
//
var _gipLayers = {}
// @todo: Replace ids with random strings.
//
var _charts = {}
const FOCUS_OVERVIEW = "o"
const FOCUS_FOCUS = "f"


/**
 *  PRIVATE FUNCTIONS
 */

function relocate_layerController() {
    if (_layerControl && _options._sidebar && _options._sidebar.hasOwnProperty('_SIDEBAR_LAYERCONTROLID')) {
        var newloc = document.getElementById(_options._sidebar._SIDEBAR_LAYERCONTROLID)
        newloc.appendChild(_layerControl._container)
    }
}

function install_focus_handler() {
    var resetloc = $('.leaflet-sidebar-tabs a[href="#' + _options._sidebar._SIDEBAR_MAPFOCUS + '"]')
    if (resetloc.length > 0) {
        resetloc.click(function(event) {
            event.preventDefault()
            resetLocation(FOCUS_FOCUS)
        })
    }

    var overviewloc = $('.leaflet-sidebar-tabs a[href="#' + _options._sidebar._SIDEBAR_MAPOVERVIEW + '"]')
    if (overviewloc.length > 0) {
        overviewloc.click(function(event) {
            event.preventDefault()
            resetLocation(FOCUS_OVERVIEW)
        })
    }


}

function resetLocation(mode) {
    if (Util.isSet(_options.center)) {
        if (mode == FOCUS_OVERVIEW) {
            _map.setView(_options.center, _options.zoom_overview)
        } else {
            _map.setView(_options.center, _options.zoom)
        }
    } else if (Util.isSet(_map.options.center) && isSet(_map.options.zoom)) {
        if (mode == FOCUS_OVERVIEW) {
            _map.setView(_map.options.center, _options.zoom_overview)
        } else {
            _map.setView(_map.options.center, _map.options.zoom)
        }
    }
    if (_options._sidebar)
        _options._sidebar.close()
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


function install_hmtl() {
    var mapLoc = $('#' + _options.elemid)
    if (!mapLoc.length) {
        console.log(MODULE_NAME + "::install_map: Error - cannot find map at #" + _options.elemid)
        return _map
    }

    _map = L.map(_options.elemid, {
        center: _options.center,
        zoom: _options.zoom,
        layers: _options.layers,
        zoomSnap: 0.5,
        attributionControl: false // will be displayed in sidebar
    })

    _map.setView(_options.center, _options.zoom)

    //_map.on('zoomend', showHideLayers)

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

    _layerControl.addGipLayer = function(layer, layerName, layerGroupName) {
        if (_layerControlGrouped) {
            _layerControl.addOverlay(layer, layerName, layerGroupName)
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


    if (_options.debug) {
        run_tests()
    }

    return _map
} // install_map()


function install_handlers() {
    _dashboard.register(_options.elemid, _options.msgtype)
    $("#" + _dashboard.getElemPrefix() + _options.elemid).on(_dashboard.getMessagePrefix() + _options.msgtype, function(event, feature) {
        // we need to find which layer to update.
        // the layer is supplied through the layer_name property.
        //console.log('L.Oscars::gip:update: Info - ', feature)
        if (_options.debug)
            console.log(MODULE_NAME + "::on", feature)
        if (feature.properties && feature.properties.layer_name) {
            var layer = Oscars.Map.findGIPLayer(feature.properties.layer_name)
            if (layer) {
                layer.update(feature)
            } else {
                console.log(MODULE_NAME + "::gip:update: Warning - Cannot find GIP layer", feature)
            }
        } else {
            console.log(MODULE_NAME + "::gip:update: Warning - Feature has no layer name", feature)
        }
    })

    $("#" + _dashboard.getElemPrefix() + _options.elemid).on(_dashboard.getMessagePrefix() + "theme", function(event, message) {
        if (localStorage.getItem('theme') === 'theme-dark') {
            setTheme('theme-light');
        } else {
            setTheme('theme-dark');
        }
    })

} // install_handlers()


function run_tests() {
    L.marker(_options.center, { icon: L.icon.pulse({ iconSize: [10, 10], color: 'red' }) }).addTo(_map);
}


function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    document.documentElement.className = themeName;
    if (themeName == 'theme-dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
        _options.themes.dark.forEach(function f(l) {
            l.addTo(_map)
        })
        _options.themes.light.forEach(function f(l) {
            _map.removeLayer(l)
        })
    } else {
        document.documentElement.setAttribute('data-theme', 'light')
        _options.themes.light.forEach(function f(l) {
            l.addTo(_map)
        })
        _options.themes.dark.forEach(function f(l) {
            _map.removeLayer(l)
        })
    }
}


/**
 *  PUBLIC INTERFACE
 */
function init(options, dashboard, Sidebar = false) {
    if (_options)
        return _options

    _options = Util.extend(DEFAULTS, options)

    if (dashboard) {
        _dashboard = dashboard
    }

    _map = install_hmtl()
    install_handlers()

    if (Sidebar) {
        Sidebar.init(_options.sidebar, dashboard)
        _options._sidebar = Sidebar.getSidebar()
        Sidebar.install(_map)
        relocate_layerController()
        install_focus_handler()
    }

    return _options
}


function getMap() {
    return _options ? _map : false
}


function findGIPLayer(name) {
    return _gipLayers[name]
}


// Adds a layer to the supplied control layer. If the device/zone layers has a "grouping category", places it in,
// otherwise, uses generic Devices/Zones layers.
function addLayerToControlLayer(featureCollection, layer) {
    var layer_display_name, display_name, name
    if (featureCollection.type == "FeatureCollection") {
        var type = "Devices"
        if (featureCollection.features.length > 0) {
            type = (featureCollection.features[0].geometry.type == "Point") ? "Devices" : "Zones"
        }
        layer_display_name = Util.isSet(featureCollection.properties) && Util.isSet(featureCollection.properties.layer_display_name) ? featureCollection.properties.layer_display_name : type
        display_name = featureCollection.properties.display_name
        name = featureCollection.properties.name
    } else if (Array.isArray(featureCollection) && featureCollection.length > 0) { // collections of features gets the name of the type of the first element
        layer_display_name = (featureCollection[0].geometry.type == "Point") ? "Devices" : "Zones"
        display_name = Util.isSet(featureCollection[0].properties.display_type) ? featureCollection[0].properties.display_type : featureCollection[0].properties.type
        name = Util.isSet(featureCollection[0].properties.layer_name) ? featureCollection[0].properties.layer_name : null
    } else { // layers from one element gets the name from that element
        layer_display_name = (featureCollection.geometry.type == "Point") ? "Devices" : "Zones"
        display_name = featureCollection.properties.display_name
        name = featureCollection.properties.name
    }
    if (_layerControl) {
        _layerControl.addGipOverlay(layer, display_name, layer_display_name)
        if (name) {
            // console.log('Map::addLayerToControlLayer: Info - Adding', name)
            _gipLayers[name] = layer
        } else {
            console.log('Map::addLayerToControlLayer: featureCollection has no layer name', featureCollection)
        }
    } else {
        console.log('Map::addLayerToControlLayer: _layerControl not set', featureCollection)
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


function addDeviceLayer(featureCollection, options) {
    var l = L.Oscars.deviceLayer(featureCollection, options)
    // l.addTo(this._map)
    Oscars.Map.addLayerToControlLayer(featureCollection, l)
    return l
}


function addZoneLayer(featureCollection, options) {
    var l = L.Oscars.zoneLayer(featureCollection, options)
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