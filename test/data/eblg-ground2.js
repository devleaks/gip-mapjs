var eblgGround2 = {
  "type": "FeatureCollection",
  "properties" : {
	"name" : "GROUND"
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "marker-color": "#7E7E7E",
        "marker-size": "medium",
        "marker-symbol": "car",
		"name" : "MARSHALL01",
		"display_name": "Marshall 01",
        "type": "MARSHALL",
		"display_type": "Marshall",
        "display_status": "ACTIVE",
		"group_name": "MARSHALLS",
		"group_display_name": "Marshalls",
		"_style": {
		    "markerColor": "rgb(255,0,0)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(255,0,0)",
		    "fillOpacity": 0.4,
			"markerSymbol": 'taxi',
			markerSize: '12px'
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
		},
        "status": "IDLE"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          5.4605,
          50.645
        ]
      }
    },
  {
    "type": "Feature",
    "properties": {
      "marker-color": "#7E7E7E",
      "marker-size": "medium",
      "marker-symbol": "fuel",
		"name" : "FUEL07",
		"display_name": "Fuel 07",
      "type": "FUEL",
		"display_type": "POL",
      "display_status": "IDLE",
		"style": {
		    "markerColor": "rgb(90,90,90)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(255,0,0)",
		    "fillOpacity": 0.4,
			"markerSymbol": 'truck'
		},
		"templates": {
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
		},
      "status": "INACTIVE"
    },
    "geometry": {
      "type": "Point",
      "coordinates": [
        5.4596471786499016,
        50.64328317067921
      ]
    }
  },

  ]
};