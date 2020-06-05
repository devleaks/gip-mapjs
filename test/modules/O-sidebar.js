/*
 * jQuery Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 *
 *  Sidebar area on leaflet map for Oscars GIP.
 */
"use strict"
const VERSION = "5.0.0"
const MODULE_NAME = "Sidebar"

import * as Util from './O-utils.js'

/**
 *  DEFAULT VALUES
 */
const DEFAULTS = {
    map_elemid: "map",
    elemid: "sidebar",
    msgtype: "sidebar",
    panels: {
        layerControl: {
            elemid: "olayercontrol"
        },
        focus: {
            elemid: "ofocus",
            elemid2: "overview"
        },
        info: {
            elemid: "oinfo"
        },
        settings: false,
        about: {
            elemid: "oabout"
        }
    },
    debug: false
}


/**
 *  PRIVATE VARIABLES
 */
var _options = false
var _sidebar = null

var _dashboard = false


/**
 *  PRIVATE FUNCTIONS
 */
function install_hmtl() {
    const SIDEBARCONTENTID = _options.elemid + "_ocontent"
    var mapLoc = $("#" + _options.map_elemid)

    mapLoc.prepend($('<div>')
        .attr("id", _options.elemid)
        .addClass("client")
        .addClass("leaflet-sidebar")
        .addClass("collapsed")
        .append($('<div>')
            .addClass("leaflet-sidebar-tabs")
            .append($('<ul>')
                .attr("role", "tablist")))
        .append($('<div>')
            .attr("id", SIDEBARCONTENTID)
            .addClass("leaflet-sidebar-content")))

    // see https://gis.stackexchange.com/questions/151310/leaflet-scroll-wheel-controlling-map-zoom-and-not-drop-down-menu
    var elem = L.DomUtil.get(SIDEBARCONTENTID)
    L.DomEvent.on(elem, 'mousewheel', L.DomEvent.stopPropagation)

    // Wrap elements in side bar if requested
    _sidebar = L.control.sidebar({
        container: _options.elemid,
        position: 'right',
        closeButton: true
    })
}


// Add sidebar tab and content
function addSidebarTab(options) {
//    console.log(MODULE_NAME + "::addSidebarTab", options.id, options)
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


function install_panels() {
    // LAYER CONTROL
    if (_options.panels.layerControl) {
        _sidebar._SIDEBAR_LAYERCONTROLID = _options.elemid + _options.panels.layerControl.elemid
        addSidebarTab({
            zone: 1,
            id: _options.elemid + _options.panels.layerControl.elemid,
            info: "Layers",
            title: 'Layers<div class="toggle-btn" id="_1st-toggle-btn"><input id="i_1st-toggle-btn" type="checkbox"><span></span></div>',
            subtitle: "&nbsp",
            icon: "bars",
            icon_extra: null,
            tab_content: $('<div>')
                .append($('<div>')
                    .attr("id", _sidebar._SIDEBAR_LAYERCONTROLID)
                )
        })
    }

    $("#i_1st-toggle-btn").change(function() {
        $("#" + _dashboard.getElemPrefix() + _options.map_elemid).trigger(_dashboard.getMessagePrefix() + "theme", {})
    })


    // FOCUS (2 focuses: local, overview)
    _sidebar._SIDEBAR_MAPFOCUS = _options.elemid + _options.panels.focus.elemid
    _sidebar._SIDEBAR_MAPOVERVIEW = _options.elemid + _options.panels.focus.elemid2
    if (_options.panels.focus) {
        addSidebarTab({
            zone: 1,
            id: _sidebar._SIDEBAR_MAPFOCUS,
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
            id: _sidebar._SIDEBAR_MAPOVERVIEW,
            title: "Area Map",
            info: "Wide area map around airport",
            subtitle: "&nbsp",
            icon: "globe-europe",
            icon_extra: null,
            tab_content: null,
            nocontent: true
        })
    }

    // INFO
    _sidebar._SIDEBAR_MAPINFO = _options.elemid + _options.panels.info.elemid
    const MAPINFOCONTENT = _options.elemid + "_oinfocontent"
    if (_options.info) {
        addSidebarTab({
            zone: 1,
            id: _sidebar._SIDEBAR_MAPINFO,
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

    // OPTIONS
    if (_options.panels.settings) {
        addSidebarTab({
            zone: 2,
            id: _options.elemid + _options.panels.settings.elemid,
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

    // ABOUT
    if (_options.panels.about) {
        var aboutOptions = {
            zone: 2,
            id: _options.elemid + _options.panels.about.elemid,
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
}


function install_handlers() {
    // change info panel content
    var msgtype = "info"
    _dashboard.register(_options.elemid, _options.msgtype)
    $("#" + _dashboard.getElemPrefix() + _options.elemid).on(_dashboard.getMessagePrefix() + msgtype, function(event, message) {
        // we need to find which layer to update.
        // the layer is supplied through the *_group name property.
        //console.log('L.Oscars::gip:update: Info - ', feature)
        if (_options.debug)
            console.log(MODULE_NAME + "::on", message)
        _sidebar.setContent(message)
        _sidebar.open(_sidebar._SIDEBAR_MAPINFO)
    })
} // install_handlers()


function run_tests() {
    // L.marker(_options.center, { icon: L.icon.pulse({ iconSize: [10, 10], color: 'red' }) }).addTo(_map);
    ;
}

/**
 *  PUBLIC INTERFACE
 */
function init(options, dashboard) {
    if (_options)
        return _options

    _options = Util.extend(DEFAULTS, options)

    if (dashboard) {
        _dashboard = dashboard
    }

    install_hmtl()

    return _options
}


function install(map) { // map needs to exist before we can continue here
    _sidebar.addTo(map)
    install_panels()
    install_handlers()
}


function addModule(module) {
    addSidebarTab(module)
}


function getSidebar() {
    return _options ? _sidebar : false
}


/**
 *  MODULE EXPORTS
 */
function version() {
    console.log(MODULE_NAME, VERSION);
}

export {
    init,
    install,
    version,
    getSidebar,
    addModule
}