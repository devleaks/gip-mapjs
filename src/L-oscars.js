/*
 * GIP Viewer
 * 2017-2020 Pierre M
 * License: MIT
 */


/* ENVIRONMENT
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


var baseLayers = {
    "OSM France": OpenStreetMap_France,
    "OpenTopo": OpenTopoMap,
    "Stadia Alidade Smooth Dark": Stadia_AlidadeSmoothDark,
    "ESRI World Imagery": Esri_WorldImagery
};

var airportOverlay = new L.ImageOverlay("data/EBLG_GMC01_v13.svg", new L.LatLngBounds(
    new L.LatLng(50.62250, 5.41630), // en bas à gauche
    new L.LatLng(50.65655, 5.47567)), { // en haut à droite 
    opacity: 0.8
});

var airportNightOverlay = new L.ImageOverlay("data/EBLG_GMC01_v13-night.svg", new L.LatLngBounds(
    new L.LatLng(50.62250, 5.41630), // en bas à gauche
    new L.LatLng(50.65655, 5.47567)), { // en haut à droite 
    opacity: 1
});

/* GIP OPTIONS
 */
var dashboard_options = {
        elemprefix: "",
        msgprefix: "GIP-",
        websocket: 'ws://localhost:8051',
        reconnect_retry: 30, // seconds
        debug: false
    },
    map_options = {
        map_id: "map",
        map_message: "map",
        center: [50.64, 5.445],
        zoom: 15,
        layers: [OpenStreetMap_France],
        layerControl: {
            baseLayers: baseLayers,
            overlays: {
                "<span style='color: #0C64AF;'><img src='data/liegeairport-14.png'>&nbsp;Liège Airport</span>": {
                    "<span style='color: #EE850A;'>Day</span>": airportOverlay,
                    "<span style='color: #EE850A;'>Night</span>": airportNightOverlay
                }
            },
            options: { groupCheckboxes: true, collapsed: false }
        },
        layerControlOptions: { useGrouped: true, groupCheckboxes: true, collapsed: false },
        name: "GIPVIEWER",
        display_name: "GIP Viewer",
        sidebar: true,
        reset: true, // includes overview as well
        wire: true,
        search: false,
        betterScale: true,
        track: false,
        speedVector: false,
        info: false,
        info_id: "info",
        info_content_id: "device-info",
        voice: false,
        stylesets: false,
        about: true,
        client: "oscars",
        debug: false
    },
    wire_options = {
        wire_id: "wire_id",
        wire_message: "wire",
        voice: false,
        debug: false
    }


/*  INITIALIZE OSCARS GIP VIEWER
 */
var dashboard = Oscars.Dashboard

dashboard.init(dashboard_options)

map_options.dashboard_options = dashboard_options
map_options.wire_options = wire_options
var map = Oscars.Map.map(map_options, dashboard)

wire_options.dashboard_options = dashboard_options
var wire = Oscars.Wire.init(wire_options, dashboard)


/* POPULATE WITH BASIC DATA
 */
const tower = [50.63725474594362, 5.453993082046508]
var radar = L.layerGroup().addTo(map)
L.circle(tower, { radius: 80000, color: "darkred", opacity: 0.5, weight: 1, fill: false }).addTo(radar)
L.circle(tower, { radius: 160000, color: "darkblue", opacity: 0.4, weight: 1, fill: false }).addTo(radar)


var aircrafts = Oscars.deviceGroup({
    "type": "FeatureCollection",
    "properties": {
        "name": "AIRCRAFTS",
        "display_name": "Aircfrafts",
        "type": "AIRCRAFT",
        "display_type": "Aircfraft",
        "status": "ACTIVE"
    },
    "features": []
}, {
    greyOut: 600000, // 10 mins
    takeOut: 1800000, // 30 mins
    search: true
}).addTo(map);


var services = Oscars.deviceGroup({
    "type": "FeatureCollection",
    "properties": {
        "name": "SERVICES",
        "display_name": "Service vehicles",
        "type": "SERVICE",
        "display_type": "Service",
        "status": "ACTIVE"
    },
    "features": []
}, {
    greyOut: 600000, // 10 mins
    takeOut: 1800000, // 30 mins
    search: true
}).addTo(map);


var trucks = Oscars.deviceGroup({
    "type": "FeatureCollection",
    "properties": {
        "name": "TRUCKS",
        "display_name": "Trucks",
        "type": "TRUCK",
        "display_type": "Truck",
        "status": "ACTIVE"
    },
    "features": []
}, {
    greyOut: 600000, // 10 mins
    takeOut: 1800000, // 30 mins
    search: true
}).addTo(map);


var parkingStyle = {
    available: {
        markerSymbol: "map-marker",
        markerSize: 24, // px
        markerColor: "rgb(0,128,256)", // lighter blue
        color: "green", // stroke color
        opacity: 0.6, // stroke opacity 0 = transparent
        weight: 1, // stroke width
        fillColor: "grey", // fill color
        fillOpacity: 0.2, // fill opacity 1 = opaque
        fillPattern: "solid", // fill pattern (currently unused)
        inactiveMarkerColor: "darkgrey"
    },
    busy: {
        markerSymbol: "map-marker",
        markerSize: 24, // px
        markerColor: "rgb(0,128,256)", // lighter blue
        color: "red", // stroke color
        opacity: 0.6, // stroke opacity 0 = transparent
        weight: 1, // stroke width
        fillColor: "red", // fill color
        fillOpacity: 0.2, // fill opacity 1 = opaque
        fillPattern: "solid", // fill pattern (currently unused)
        inactiveMarkerColor: "darkgrey"
    }
}

var parkings = Oscars.zoneGroup({
    "type": "FeatureCollection",
    "properties": {
        "name": "PARKINGS",
        "display_name": "Parkings",
        "type": "PARKING",
        "display_type": "Parking",
        "status": "ACTIVE"
    },
    "features": eblgParkings.features
}, {
    //gipDefaults: {
    //    STYLE: parkingStyle.available
    //}
}).addTo(map);


function parking(name, avail) {
    const parr = eblgParkings.features.filter(f => f.properties.name == name)
    if (parr.length > 0) {
        const park = parr[0]
        park.properties._style = parkingStyle[avail]
        parkings.update(park)
    }

}
//parking(124, "busy") // test

dashboard.register(map_options.map_id, "parking")
$("#" + dashboard_options.elemprefix + map_options.map_id).on(dashboard_options.msgprefix + "parking", function(event, msg) {
    if (dashboard_options.debug)
        console.log("Map::on", msg)
    parking(msg.name, msg.available)
})


if (map_options.debug) // ping at tower if debugging
    L.marker(tower, { icon: L.icon.pulse({ iconSize: [10, 10], color: 'red' }) }).addTo(radar);