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
    "color": "#333333",
    "pulseColor": "#ffffff",
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
var map = Oscars.Map.map(map_options, dashboard)

wire_options.dashboard_options = dashboard_options
var wire = Oscars.Wire.init(wire_options, dashboard)


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


var parkingStyle = {
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

const APRONS_MAX = [1,1,32,21,22,5,5] // no APRON 0 or 1.
var   APRONS     = [0,0,0, 0, 0, 0,0]

function parking(name, avail) {
    const parr = eblgParkings.features.filter(f => f.properties.name == name)
    if (parr.length > 0) {
        const park = parr[0]
        park.properties._style = parkingStyle[avail]
        parkings.update(park)
        if(avail == "busy") {
            APRONS[park.properties.ID_Apron_z]++
        } else {
            APRONS[park.properties.ID_Apron_z] = APRONS[park.properties.ID_Apron_z] == 0 ? 0 : APRONS[park.properties.ID_Apron_z]-1
        }
        var t = APRONS.map((x, i) => Math.round(100 * x/APRONS_MAX[i]))
        Oscars.Map.updateChart("parking", t.slice(Math.max(t.length - 5, 1)), APRONS.reduce((a, v) => a + v))
    }
}
//parking(124, "busy") // test

dashboard.register(map_options.map_id, "parking")
$("#" + dashboard_options.elemprefix + map_options.map_id).on(dashboard_options.msgprefix + "parking", function(event, msg) {
    if (dashboard_options.debug)
        console.log("Map::on:parking", msg)
    parking(msg.name, msg.available)
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
    Oscars.Util.flightboard(move, flight, airport, timetype, day, time, note)
    */
    Oscars.Util.flightboard(msg.move, msg.flight, msg.airport, msg.info, moment(msg.date + " " + msg.time, msg.info == "scheduled" ? "YYYY-MM-DD HH:mm" : "DD/MM HH:mm"), "")
    Oscars.Util.getFlightboard(msg.move, undefined, moment(msg.timestamp, moment.ISO_8601), true)
    $('.flightboard-time').html("Last updated at "+moment(msg.timestamp, moment.ISO_8601).format("HH:mm"))
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