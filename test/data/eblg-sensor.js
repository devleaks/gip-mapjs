var eblgSensor = {
	"type": "FeatureCollection",
	"properties" : {
	"name" : "SENSOR",
	"display_name": "Sensors",
	"type" : "*",
	"display_type": "All",
	"status": "ACTIVE",
	"layer_group_display_name": "Sensors"
	},
	"features": [
	{
	    "type": "Feature",
	    "properties": {
			"name" : "SENSOR01",
			"display_name": "Sensor 01",
			"type": "SENSOR",
			"display_type": "FUEL",
			"display_status": "ACTIVE",
			"status": "INACTIVE",
			"_templates": {
				"show_label": true,
				"tooltip":	"{{feature.properties.display_name}}",
				"popup":		"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
				"sidebar":	"{{feature.properties.display_name}}"
							+"Available {{&texts.linkURL}}."
							,
				"linkText":	"Link to {{feature.properties.display_name}}",
				"linkURL":	"<a href='#path-to-get-more-details?id={{feature.properties.name}}'>{{texts.linkText}}</a>"	// !
			},
			"_data": {
				"type": "donut",
				"values": [40, 60],
				"radius": 16,
				"innerRadius": 8
			}
	    },
	    "geometry": {
			"type": "Point",
			"coordinates": 	[5.448, 50.639]
	    }
  	},
	{
	    "type": "Feature",
	    "properties": {
			"name" : "SENSOR02",
			"display_name": "Sensor 02",
			"type": "SENSOR",
			"display_type": "FUEL",
			"display_status": "ACTIVE",
			"status": "INACTIVE",
			"_templates": {
				"show_label": true,
				"tooltip":	"{{feature.properties.display_name}}",
				"popup":		"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
				"sidebar":	"{{feature.properties.display_name}}"
							+"Available {{&texts.linkURL}}."
							,
				"linkText":	"Link to {{feature.properties.display_name}}",
				"linkURL":	"<a href='#path-to-get-more-details?id={{feature.properties.name}}'>{{texts.linkText}}</a>"	// !
			},
			"_data": {
				"type": "bar",
				"values": [3,5,1,6,2,2,5,3,6,2,9],
				"width": 60
			}
	    },
	    "geometry": {
			"type": "Point",
			"coordinates": 	[5.453, 50.642]
	    }
  	},{
	    "type": "Feature",
	    "properties": {
			"name" : "SENSOR03",
			"display_name": "Sensor 03",
			"type": "SENSOR",
			"display_type": "FUEL",
			"display_status": "ACTIVE",
			"status": "INACTIVE",
			"_templates": {
				"show_label": true,
				"tooltip":	"{{feature.properties.display_name}}",
				"popup":		"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
				"sidebar":	"{{feature.properties.display_name}}"
							+"Available {{&texts.linkURL}}."
							,
				"linkText":	"Link to {{feature.properties.display_name}}",
				"linkURL":	"<a href='#path-to-get-more-details?id={{feature.properties.name}}'>{{texts.linkText}}</a>"	// !
			},
			"_data": {
				"type": "donut",
				"values": [3,5,1,6],
				"innerRadius": 8,
				"radius": 16,
				"fill": ["#f18700", "#0e64ae"]
			}
	    },
	    "geometry": {
			"type": "Point",
			"coordinates": 	[5.453,50.640]
	    }
  	},{
	    "type": "Feature",
	    "properties": {
			"name" : "SENSOR04",
			"display_name": "Sensor 04",
			"type": "SENSOR",
			"display_type": "FUEL",
			"display_status": "ACTIVE",
			"status": "INACTIVE",
			"_templates": {
				"show_label": true,
				"tooltip":	"{{feature.properties.display_name}}",
				"popup":		"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
				"sidebar":	"{{feature.properties.display_name}}"
							+"Available {{&texts.linkURL}}."
							,
				"linkText":	"Link to {{feature.properties.display_name}}",
				"linkURL":	"<a href='#path-to-get-more-details?id={{feature.properties.name}}'>{{texts.linkText}}</a>"	// !
			},
			"_data": {
				"type": "line",
				"values": [3,5,1,6,2],
				"fill": "rgba(241, 135, 0, 0.4)",
				"stroke": "#0e64ae",
				"strokeWidth": 2,
				"height": 35
			}
	    },
	    "geometry": {
			"type": "Point",
			"coordinates": 	[5.451, 50.641]
	    }
  	},{
	    "type": "Feature",
	    "properties": {
			"name" : "SENSOR05",
			"display_name": "Sensor 05",
			"type": "SENSOR",
			"display_type": "FUEL",
			"display_status": "ACTIVE",
			"status": "INACTIVE",
			"_style": {
				"markerRotationOffset": 317
			},
			"_templates": {
				"show_label": true,
				"tooltip":	"{{feature.properties.display_name}}",
				"popup":		"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
				"sidebar":	"{{feature.properties.display_name}}"
							+"Available {{&texts.linkURL}}."
							,
				"linkText":	"Link to {{feature.properties.display_name}}",
				"linkURL":	"<a href='#path-to-get-more-details?id={{feature.properties.name}}'>{{texts.linkText}}</a>"	// !
			},
			"_data": {
				"type": "line",
				"values": [7,7,5,8,1,5,5,7,6,4,10,3,1,3,7,7,2,7,1,2],
				"fill": "rgba(241, 135, 0, 0.4)",
				"stroke": "#0e64ae",
				"width": 70
			}
	    },
	    "geometry": {
			"type": "Point",
			"coordinates": 	[5.453,50.643]
	    }
  	}
  	]
};