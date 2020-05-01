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

var taxi = L.layerGroup()
const coords = [
    [5.429949760437012, 50.63114388301683],
    [5.429954058512539, 50.63114134949315],
    [5.4300850801914065, 50.631230783397214],
    [5.429564, 50.6308751],
    [5.429318527068739, 50.631318244774675],
    [5.429232925101118, 50.63147277938857],
    [5.4290592, 50.6317864],
    [5.428817709421531, 50.63231467747907],
    [5.429129626316126, 50.632751316258556],
    [5.429284237579302, 50.632967749784335],
    [5.429492569545375, 50.633259384565804],
    [5.429753883859989, 50.63362518701309],
    [5.429857187508972, 50.63376979726021],
    [5.429691777776567, 50.63439672769832],
    [5.429169516235367, 50.63428802698654],
    [5.428909278126775, 50.63423386242452],
    [5.428735282689058, 50.63419764794876],
    [5.428735282689058, 50.63419764794876],
    [5.428615580164676, 50.63417273370833],
    [5.4281532415751315, 50.63506637478467]
]
var latlngs = []
coords.forEach(function(p) {
    latlngs.push([p[1], p[0]])
})
L.polyline.antPath(latlngs, {
    "delay": 500,
    "dashArray": [
        30,
        100
    ],
    "weight": 1,
    "color": "rgba(255,255,255,0.1)",
    "pulseColor": "rgba(0,255,0,1)",
    "paused": false,
    "reverse": false,
    "hardwareAccelerated": true
}).addTo(taxi)

var night = L.layerGroup([airportNightOverlay, r1, r2, r3])
var day = airportOverlay

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
                "<span style='color: #0C64AF;'><img src='src/i/liegeairport-14.png'>&nbsp;Liège Airport</span>": {
                    "<span style='color: #EE850A;'>Day</span>": airportOverlay,
                    "<span style='color: #EE850A;'>Night</span>": night
                }
            },
            options: { groupCheckboxes: true, collapsed: false }
        },
        layerControlOptions: { useGrouped: true, groupCheckboxes: true, collapsed: false },
        name: "GIPVIEWER",
        display_name: "GIP Viewer",
        sidebar: true,
        reset: true, // includes overview as well
        flightboard: true,
        charts: true,
        wire: true,
        search: false,
        betterScale: true,
        track: false,
        speedVector: false,
        info: true,
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

var map = Oscars.Omap.map(map_options, dashboard)

wire_options.dashboard_options = dashboard_options
var wire = Oscars.Wire.init(wire_options, dashboard)

taxi.addTo(map)


/* POPULATE WITH BASIC DATA
 */
const tower = [50.63725474594362, 5.453993082046508]
var radar = L.layerGroup().addTo(map)
L.circle(tower, { radius: 80000, color: "red", opacity: 0.3, weight: 1, fill: false }).addTo(radar)
L.circle(tower, { radius: 160000, color: "blue", opacity: 0.3, weight: 1, fill: false }).addTo(radar)

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


var taxiways = false
var parkings = false
$.ajaxSetup({
    async: false
})
$.getJSON("test/data/eblg-taxiways.geojson", function(data) {
    taxiways = data
})
$.getJSON("test/data/json/eblg-parking-boxes.geojson", function(data) {
    parkings = data
})
$.ajaxSetup({
    async: true
})

const parkingStyle = {
    available: {
        markerSymbol: "map-marker",
        markerSize: 24, // px
        markerColor: "rgb(0,128,256)", // lighter blue
        color: "#E6E04F", // stroke color
        opacity: 0.6, // stroke opacity 0 = transparent
        weight: 1, // stroke width
        fillColor: "green", // fill color
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

var parkingsZoneGroup = Oscars.zoneGroup({
    "type": "FeatureCollection",
    "properties": {
        "name": "PARKINGS",
        "display_name": "Parkings",
        "type": "PARKING",
        "display_type": "Parking",
        "status": "ACTIVE"
    },
    "features": parkings.features
}, {
    style: {
        color: "yellow"
    }
    /*gipDefaults: {
        STYLE: {
            markerSymbol: "map-marker",
            markerSize: 24, // px
            markerColor: "rgb(0,128,256)", // lighter blue
            color: "#E6E04F", // stroke color
            opacity: 1, // stroke opacity 0 = transparent
            weight: 1, // stroke width
            fillColor: "white", // fill color
            fillOpacity: 0, // fill opacity 1 = opaque
            fillPattern: "solid", // fill pattern (currently unused)
            inactiveMarkerColor: "darkgrey"
        }
    }*/
}).addTo(map);

const APRONS_MAX = [1, 1, 32, 21, 22, 5, 5] // no APRON 0 or 1.
var APRONS = [0, 0, 0, 0, 0, 0, 0]

function parking(parking) {
    const parr = parkings.features.filter(f => f.properties.name == parking.name)
    if (parr.length > 0) {
        const box = parr[0]
        box.properties._style = parkingStyle[parking.available]
        parkingsZoneGroup.update(box)
        if (parking.available == "busy") {
            APRONS[box.properties.apron]++
            Oscars.Omap.createGantt(parking)
        } else {
            APRONS[box.properties.apron] = APRONS[box.properties.apron] == 0 ? 0 : APRONS[box.properties.apron] - 1
            Oscars.Omap.deleteGantt(parking)
        }
        // update APRON chart
        var t = APRONS.map((x, i) => Math.round(100 * x / APRONS_MAX[i]))
        Oscars.Omap.updateChart("parking", t.slice(Math.max(t.length - 5, 1)), APRONS.reduce((a, v) => a + v))
    }
}
//parking(124, "busy") // test
//Oscars.Omap.createGantt({name: "name"})

dashboard.register(map_options.map_id, "stopped")
$("#" + dashboard_options.elemprefix + map_options.map_id).on(dashboard_options.msgprefix + "stopped", function(event, msg) {
    //if (dashboard_options.debug)
        console.log("Map::on:stopped", msg.feature.id, event, msg)
    const feature = msg.feature
    if (feature && feature.hasOwnProperty("geometry")) {
        // try to find parking in which feature is stopped
        const parr = parkings.features.filter(f => turf.booleanPointInPolygon(feature.geometry.coordinates, f))
        if (parr.length > 0) {
            const box = parr[0]
            Oscars.Omap.updateGantt({
                parking: box.properties.name,
                feature: feature
            })
        } else {
            console.log("Map::on:stopped: not parked", feature)
        }
    } else {
        console.log("Map::on:stopped: Issue?", feature)
    }
})

dashboard.register(map_options.map_id, "parking")
$("#" + dashboard_options.elemprefix + map_options.map_id).on(dashboard_options.msgprefix + "parking", function(event, msg) {
    if (dashboard_options.debug)
        console.log("Map::on:parking", msg)
    parking(msg)
})

dashboard.register(map_options.map_id, "flightboard")
$("#" + dashboard_options.elemprefix + map_options.map_id).on(dashboard_options.msgprefix + "flightboard", function(event, msg) {
    if (dashboard_options.debug)
        console.log("Map::on:flightboard", msg)
    /* msg payload: {
          info: "actual",
          move: "departure",
          flight: flight.flight,
          airport: flight.airport,
          date: dept.format("DD/MM"),
          time: dept.format("HH:mm"),
          parking: flight.parking,
          timestamp: iso8601 of emission of message
    } // api:
    Oscars.Util.flightboard(move, flight, airport, timetype, day, time, note, parking)
    */
    Oscars.Util.flightboard(msg.move, msg.flight, msg.airport, msg.info, moment(msg.date + " " + msg.time, msg.info == "scheduled" ? "YYYY-MM-DD HH:mm" : "DD/MM HH:mm"), "", msg.parking)
    Oscars.Util.updateFlightboard(msg.move, undefined, moment(msg.timestamp, moment.ISO_8601), true)
    Oscars.Util.updateFlightboardCharts(msg.move, moment(msg.timestamp, moment.ISO_8601))
    $('.simulated-time').html("Last updated at " + moment(msg.timestamp, moment.ISO_8601).format("HH:mm"))
})

if (map_options.debug) // ping at tower if debugging
    L.marker(tower, { icon: L.icon.pulse({ iconSize: [10, 10], color: 'red' }) }).addTo(radar);


// function to set a given theme/color-scheme
function setTheme(themeName) {
    localStorage.setItem('theme', themeName);
    document.documentElement.className = themeName;
    if (themeName == 'theme-dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
        CartoDB_DarkMatterNoLabels.addTo(map)
        night.addTo(map)
        map.removeLayer(day)
        map.removeLayer(OpenStreetMap_France)
    } else {
        document.documentElement.setAttribute('data-theme', 'light')
        OpenStreetMap_France.addTo(map)
        day.addTo(map)
        map.removeLayer(night)
        map.removeLayer(CartoDB_DarkMatterNoLabels)
    }
}

// function to toggle between light and dark theme
function toggleTheme() {
    if (localStorage.getItem('theme') === 'theme-dark') {
        setTheme('theme-light');
    } else {
        setTheme('theme-dark');
    }
}

// Immediately invoked function to set the theme on initial load
(function() {
    if (localStorage.getItem('theme') === 'theme-dark') {
        setTheme('theme-dark');
        document.getElementById('i_1st-toggle-btn').checked = true;
    } else {
        setTheme('theme-light');
        document.getElementById('i_1st-toggle-btn').checked = false;
    }
})();

/*
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "stroke": "#ffffff",
        "stroke-width": 2,
        "stroke-opacity": 1
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            5.469925403594971,
            50.65367800515634
          ],
          [
            5.457737445831299,
            50.645977340713586
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "stroke": "#ffffff",
        "stroke-width": 2,
        "stroke-opacity": 1
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            5.421152114868163,
            50.62299029225287
          ],
          [
            5.434885025024414,
            50.63156581667872
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "stroke": "#ffffff",
        "stroke-width": 2,
        "stroke-opacity": 1
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            5.462635159492493,
            50.651766562235494
          ],
          [
            5.450441837310791,
            50.64411320922499
          ]
        ]
      }
    }
  ]
}*/