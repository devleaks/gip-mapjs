var eblgAircrafts1 = {
  "type": "FeatureCollection",
  "properties" : {
	"name" : "AIRCRAFTS"
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "marker-color": "#7E7E7E",
        "marker-size": "medium",
        "marker-symbol": "airport",
		"name" : "SN123",
		"display_name": "Brussel-Madrid",
        "type": "AIRCRAFT",
		"display_type": "Aircraft",
        "display_status": "GROUND",
		"heading": 138,
		"speed": 4,
		"group_name": "AIRCRAFT",
		"group_display_name": "Aircrafts",
        "status": "ACTIVE",
		"_style": {
		    "markerColor": "rgb(0,255,0)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(0,255,0)",
		    "fillOpacity": 0.4,
			"markerSymbol": 'plane',
			"markerRotationOffset": -45
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
      "geometry": {
        "type": "Point",
        "coordinates": [
          5.437524318695068,
          50.634546465964206
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "marker-color": "#7E7E7E",
        "marker-size": 40,
        "marker-symbol": "airport",
		"name" : "OO-987",
		"display_name": "A380",
        "type": "AIRCRAFT",
		"display_type": "Aircraft",
        "display_status": "APRON",
		"physicalSize": 90,
		"heading": 137,
		"speed": 0,
        "status": "IDLE",
		"_style": {
		    "markerColor": "rgb(0,0,255)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(0,0,255)",
		    "fillOpacity": 0.4,
			"markerSymbol": 'plane',
			"markerRotationOffset": -45
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
      "geometry": {
        "type": "Point",
        "coordinates": [
           5.45987,
          50.6435
        ]
      }
    },
  ]
};