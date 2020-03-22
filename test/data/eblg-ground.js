var eblgGround = {
  "type": "FeatureCollection",
  "properties" : {
	"name" : "GROUND",
	"display_name": "Ground Vehicles",
	"type" : "*",
	"display_type": "All",
	"status": "ACTIVE"
  },
  "features": [
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
      "display_status": "ONDUTY",
      "status": "INACTIVE",
		"_style": {
		    "markerColor": "rgb(255,0,0)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(255,0,0)",
		    "fillOpacity": 0.4,
			"markerSymbol": 'truck'
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
		"data": [
			{ "name": 'Apples', "value": 25 },
			{ "name": 'Oranges', "value": 35 },
			{ "name": 'Bananas', "value": 20 },
			{ "name": 'Pineapples', "value": 30 }
		]
    },
    "geometry": {
      "type": "Point",
      "coordinates": [
        5.4596471786499015,
        50.64328317067921
      ]
    }
  },
    {
      "type": "Feature",
      "properties": {
        "marker-color": "#7E7E7E",
        "marker-size": "medium",
        "marker-symbol": "car",
		"name" : "MARSHALL01",
		"display_name": "Marshall 01",
        "type": "MARSHALL",
		"group_name": "MARSHALLS",
		"group_display_name": "Marshalls",
        "status": "ACTIVE",
		"speed": 10,
		"heading": 138,
		"_style": {
		    "markerColor": "rgb(0,255,0)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(0,255,0)",
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
		}
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          5.438168048858642,
          50.63419260881268
        ]
      }
  },
  {
    "type": "Feature",
    "properties": {
      "marker-color": "#7E7E7E",
      "marker-size": "medium",
      "marker-symbol": "telephone",
		"name" : "T51",
		"display_name": "Tetra 51",
      "type": "TETRA",
		"display_type": "4Phone",
      "display_status": "ACTIVE",
		"_style": {
		    "markerColor": "rgb(0,255,0)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(0,255,0)",
		    "fillOpacity": 0.4,
			"markerSymbol": 'phone'
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
      "status": "ACTIVE"
    },
    "geometry": {
      "type": "Point",
      "coordinates": [
        5.458488464355469,
        50.64238507967317
      ]
    }
  }
  ]
};