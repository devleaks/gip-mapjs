# Leaflet Customization for GIP

The tailoring of Leaflet.js for GIP consist of the following:

1. Installation procedure
1. Testing procedure
1. Oscars GIP Map
1. Oscars GIP Device Layer
1. Oscars GIP Device GeoJSON
1. Oscars GIP Zone Layer
1. Oscars GIP Zone GeoJSON

# Introduction

The sole purpose of the tailoring of Leaflet for GIP is to package and hides numerous plugins and options in a minimal set of interfaces.

In GIP, Leaflet is used throught the Java Vaadin framework.
Each of Leaflet's interface requires a Vaadin equivalent and most of standard Leaflet is exposed in V-Leaflet Vaadin Addon.
We could and should create a Vaadin wrapper for each individual plugin we want to add to Leaflet. This option would quickly become time consuming.

Rather, we packaged GIP's requirements into 3 plugins, and only those three plugins will require interfaces to Vaadin.
The three Leaflet GIP plugins are
 - The GIP Map
 - Leaflet layers containing GIP Devices and Sensors
 - Leaflet layers containing GIP Zones

Devices and zones cannot be mixed into the same layer.
Devices and zones are exclusively presented as GeoJSON features.

Devices and zones in GIP layers can be updated in positions and appearance.


# Installation procedure

## Prerequisite.

The installation of Oscars GIP Leaflet Custommization package requires the installation of nodejs.

## Installation
Fetch G-Leaflet repository from bitbucket in a folder.

In the g-leaflet folder, type
`npm install`

You must manually include the following javascript files:


## Alternative Build

Note: We choose to leave each individual leaflet and plugin file to load.
On request, alternatively, we could package all javascript files into a single one and all CSS files into a single one as well.

To build single files distribution, run

`gulp`

## Testing Procedure

To test the installation, simply run

`npm run tests`

# Oscars GIP Map

The Oscars GIP Map creates a regular Leaflet map and optionally adds map-level plugins and tools.

`
var map = L.Oscars.Util.map({
	id: "map",
	center: [50.64, 5.445],
	zoom: 15,
	width: 800,
	height: 600,
	name: "STATICTESTMAP",
	display_name: "A Static Test Map for GIP",
	layers: [osmMap],
	layerControl: {
		baseLayers: baseLayers,
		overlays: {
			"<span style='color: #0C64AF;'><img src='oscars/liegeairport-14.png'>&nbsp;Liège Airport</span>": {
				"<span style='color: #EE850A;'>Ground Map</span>": airportOverlay
			}
		},
		options: { groupCheckboxes: true }
	},
	sidebar: true,
	reset: true,
	betterScale: true
});
`

| Variable | JS Type | Purpose  |
|---|---|---|
| id  | string  | HTML Element identifier for the the map's container  |
| center  | array of 2 float values  | Map's center upon initialization  |
|  zoom | integer between 0 and 19  | Map's zoom factor. 0= world view, 19=Street-level view  |
| width | number or string | Map's width in CSS terms. If number is given, pixels is assumed |
| height | number or string | Map's height in CSS terms. If number is given, pixels is assumed |
| name | string | Map internal name |
| display name | string | Map Display Name |
| layers | array of Leaflet layers | Layers that will be added to the map |
| layerControl | object | Initialisation object for L.Control.GroupedLayers |
| sidebar | boolean | Create a sidebar for additional information display |
| reset | boolean | Display additional reset button to reset map center and zoom |
| betterScale | boolean | Use L.Control.BetterScale rather than Leaflet default |



# Oscars GIP Device Layer

A GIP Device Layer is used to display all devices in a GIP Device Group.


```
var snow = L.Oscars.deviceGroup({
	"type":"FeatureCollection",
	"properties" : {
		name: "SNOWVEHICLE",
		display_name: "Snow Vehicles",
		type: "SNOW",
		display_type: "Snow Vehicles",
		status: "ACTIVE",
		layer_group_display_name: "Ground Vehicles"
	},
   features:[]
	}, {
		zoom_min: 13,
		zoom_max: 18
	}
);
```

### Layer Parameters

FeatureCollection

The GeoJSON feature collection that represents the GIP Device Group. The following feature collection properties are mandatory:

| Property | JS Type | Purpose  |
|---|---|---|
| name | string | Layer internal name |
| display name | string | Layer Display Name |
| type | string | If the GIP Device Group consists of devices of the same type, this is the type (internal name of the type) of all devices. |
| display type | string | Type Display Name |
| layer_group_display_name | string | Display name of the _group_ where this layer appears in L.Control.GroupedLayers |
| features | array | Array of GeoJSON features, one for each device in the group |


Options

The following options are available:

| Option | JS Type | Purpose  |
|---|---|---|
| zoom_min  | number  | Minimum zoom level for layer display. If the zoom level is smaller than zoom_min the layer is not displayed |
| zoom_max  | number  | Maximum zoom level for layer display. If the zoom level is larger than zoom_max the layer is not displayed |


## Layer Functions

### Update

```
snow.update(featureCollection);
```

Update all features in the collection.

### Remove

```
snow.remove(feature);
```

Remove a feature from the layer.


# Oscars GIP Device GeoJSON

Each feature supplied to the GIP Device Layer must have the following properties:

```
{
	"type":"Feature",
	"properties": {
		"name" : "SNOW01",
		"display_name": "Snow 01",
		"type": "SNOW",
		"display_type": "Snow Vehicle",
		"display_status": "IDLE",
		"speed": 0,
		"heading": 178,
		"status": "IDLE",
		"_style": {
			"markerSymbol": 'snowflake-o',
			"markerRotationOffset": 0,
		    "markerColor": "rgb(0,0,200)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(0,255,0)",
		    "fillOpacity": 0.4
		},
		"_templates": {
			formatDate: function() {
			    return function(text, render) {
			    	return Date( parseInt(render(text)) * 1000);
				}
			},
			"show_label": true,
			"tooltip":	"{{feature.properties.display_name}}",
			"popup":		"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
			"sidebar":	"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}.<br/>"
						+"Last seen at formated date: {{#templates.formatDate}}"
						+"{{feature.properties._timestamp}}"
						+"{{/templates.formatDate}}.<br/>"
						+"Available {{&texts.linkURL}}."
						,
			"linkText":	"Link to {{feature.properties.display_name}}",
			"linkURL":	"<a href='#path-to-get-more-details?id={{feature.properties.name}}'>{{texts.linkText}}</a>"	// !
		}
    },
   "geometry":{
      "type":"Point",
      "coordinates":[
         5.4364728927612305,
         50.641895204617235
      ]
   }
}
```
| Property | JS Type | Purpose  |
|---|---|---|
| name | string | Device internal name |
| display name | string | Device Display Name |
| type | string | Device type (internal name) |
| display type | string | Device type (display name) |
| status | string | Device GIP Status (internal name) |
| display status | string | Device display status as supplied by customer |
| _style | object | Style object (see below) |
| _templates | object | Template object (see below) |

For devices, the following properties are optional:
| Property | JS Type | Purpose  |
|---|---|---|
| speed | number | Device speed in km/h |
| display name | number | Device heading / bearing (See style below) |

For devices, the following styling information may be supplied:

| Property | JS Type | Purpose  |
|---|---|---|
| markerSymbol | string | Marker symbol name. Can be a Font Awesome icon or a glyphicon |
| markerColor  | string | Marker color. Must be a CSS color name or value |
| markerSize   | number | Marker size in pixels |
| markerRotationOffset | number | Rotation offset that must be applied to the icon. If markerRotationOffset is supplied and not null (it can be the value 0) the icon is rotated according to the supplied device heading/bearing |


If some styling information is missing, default values are supplied.

For devices, the following text templates be supplied:

| Property | JS Type | Purpose  |
|---|---|---|
| show_label | boolean | Show a label permanently next to the device |



# Oscars GIP Zone Layer


# Oscars GIP Zone GeoJSON


