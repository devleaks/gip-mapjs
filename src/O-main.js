/*
 * GIP Viewer
 * 2017-2020 Pierre M
 * License: MIT
 *
 * Starts main viewer application.
 */
import * as Dashboard from "./O-dashboard.js"
import * as Flightboard from "./O-flightboard.js"
import * as Wire from "./O-wire.js"
import * as Chart from "./O-chart.js"
import * as Omap from "./O-map.js"

/*  DASHBOARD
 */
Dashboard.init({
    elemprefix: "",
    msgprefix: "GIP-",
    websocket: 'ws://localhost:8051',
    reconnect_retry: 30, // seconds
    debug: false
})


/*  MAP
 */
var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var OpenStreetMap_France = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    maxZoom: 20,
    attribution: '&copy; Openstreetmap France | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var OpenTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    maxZoom: 17,
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
});

var Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

var CartoDB_DarkMatterNoLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
});

var baseLayers = {
    "OSM France": OpenStreetMap_France,
    "OpenTopo": OpenTopoMap,
    "Stadia Alidade Smooth Dark": Stadia_AlidadeSmoothDark,
    "CartoDB Dark Matter": CartoDB_DarkMatterNoLabels,
    "ESRI World Imagery": Esri_WorldImagery
};

var airportOverlay = new L.ImageOverlay("test/data/EBLG_GMC01_v13.svg", new L.LatLngBounds(
    new L.LatLng(50.62250, 5.41630), // en bas à gauche
    new L.LatLng(50.65655, 5.47567)), { // en haut à droite 
    opacity: 0.8
});

// S W N E: 50.62250,5.41630,50.65655,5.47567

var airportNightOverlay = new L.ImageOverlay("test/data/EBLG_GMC01_v13-night.svg", new L.LatLngBounds(
    new L.LatLng(50.62250, 5.41630), // en bas à gauche
    new L.LatLng(50.65655, 5.47567)), { // en haut à droite 
    opacity: 1
});

const rabbit = {
    "delay": 15,
    "dashArray": [
        2,
        1500
    ],
    "weight": 3,
    "color": "rgba(30,30,30,1)",
    "pulseColor": "rgba(255,255,255,1)",
    "paused": false,
    "reverse": false,
    "hardwareAccelerated": true
}

var r1 = L.polyline.antPath([
    [50.65367800515634, 5.469925403594971],
    [50.645977340713586, 5.457737445831299]
], rabbit)
var r2 = L.polyline.antPath([
    [50.62299029225287, 5.421152114868163],
    [50.63156581667872, 5.434885025024414]
], rabbit)
var r3 = L.polyline.antPath([
    [50.651766562235494, 5.462635159492493],
    [50.64411320922499, 5.450441837310791]
], rabbit)

var night = L.layerGroup([airportNightOverlay, r1, r2, r3])
var day = airportOverlay

Omap.init({
    elemid: "map",
    msgtype: "map",

    center: [50.64, 5.445],
    zoom: 15,
    layers: [OpenStreetMap_France],

    layerControl: {
        baseLayers: baseLayers,
        overlays: {
            "<span style='color: #0C64AF;'><img src='src/i/liegeairport-14.png'>&nbsp;Liège Airport</span>": {
                "<span style='color: #EE850A;'>Day</span>"  : day,
                "<span style='color: #EE850A;'>Night</span>": night
            }
        },
        options: { groupCheckboxes: true, collapsed: false }
    },
    layerControlOptions: { useGrouped: true, groupCheckboxes: true, collapsed: false },

    betterScale: true,

    track: false,           // @todo: should move to layer
    speedVector: false,

    sidebar: {          // set it to false to disable siebar
                        // SIDE BUTTONS
        reset: true,    // includes overview as well
        search: false,
        stylesets: false,
        about: true,
        client: "oscars",   // css switch for styling @todo: replace by generic o-client

        wire: Wire,     // MODULES
        flightboard: Flightboard
        /*
        info: {
            info_id: "info",
            info_content_id: "device-info"
        }
        */
    },

    debug: false
}, Dashboard)

/*  WIRE
 */
Wire.init({
    wire_id: "wire_id",
    wire_message: "wire",
    voice: false,
    debug: false
}, Dashboard)

/*  FLIGHT BOARD
 */
Flightboard.init({}, Dashboard)

/*  CHARTS
 */
Chart.init({}, Dashboard)


/* TESTING
 */
Dashboard.version()
Omap.version()
Flightboard.version()
Wire.version()
Chart.version()

