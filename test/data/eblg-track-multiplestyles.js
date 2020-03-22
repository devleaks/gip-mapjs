var egblLandingTracks1 = {
  "type": "FeatureCollection",
  "properties" : {
	"name" : "TRACKS",
	"display_name": "Landing",
	"type" : "TRACKS",
	"display_type": "Tracks",
	"status": "ACTIVE"
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
		"name" : "23L5R",
		"display_name": "23L/5R",
		"type" : "TRACK",
		"display_type": "Track",
        "display_status": "ACTIVE",
        "stroke": "#555555",
        "stroke-width": 2,
        "stroke-opacity": 1,
        "fill": "#555555",
        "fill-opacity": 0.5,
        "status": "ACTIVE",
		"_styles": {
			"DEFAULT": {
			    "color": "rgb(0,255,0)",
			    "weight": 1,
			    "opacity": 0.8,
				"fillColor": "rgb(0,255,0)",
			    "fillOpacity": 0.4
			},
			"INVERTED": {
			    "color": "rgb(0,255,0)",
			    "weight": 1,
			    "opacity": 0.8,
				"fillColor": "rgb(0,255,0)",
			    "fillOpacity": 0.6
			}
		},
		"_templates": {
			"label":	"{{feature.properties.display_name}}",
			"tooltip":	"{{feature.properties.display_name}}",
			"popup":		"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
			"sidebar":	"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}.<br/>"
						   +"Last seen at {{feature.properties._timestamp}}.",
			"linkText":	"Link to {{feature.properties.display_name}}",
			"linkURL":	"<a href='/path-to-get-more-details?id={{feature.properties.name}}'>{{feature.properties._linkText}}</a>"	// !
		}
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              5.453488826751709,
              50.64616783173735
            ],
            [
              5.42999267578125,
              50.631388877217056
            ],
            [
              5.4302287101745605,
              50.63122554789211
            ],
            [
              5.4537034034729,
              50.646031766799176
            ],
            [
              5.453488826751709,
              50.64616783173735
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
		"name" : "5L23R",
		"display_name": "5L/23R",
		"type" : "TRACK",
		"display_type": "Track",
        "display_status": "INACTIVE",
        "stroke": "#555555",
        "stroke-width": 2,
        "stroke-opacity": 1,
        "fill": "#555555",
        "fill-opacity": 0.5,
        "status": "INACTIVE",
		"_style": {
		    color: "rgb(255,0,255)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(255,0,255)",
		    "fillOpacity": 0.4
		},
		"_templates": {
			"show_label": true,
			"tooltip":	"{{feature.properties.display_name}}",
			"popup":		"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
			"sidebar":	"{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}.<br/>"
						   +"Last seen at {{feature.properties._timestamp}}.",
			"linkText":	"Link to {{feature.properties.display_name}}",
			"linkURL":	"<a href='/path-to-get-more-details?id={{feature.properties.name}}'>{{feature.properties._linkText}}</a>"	// !
		}
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              5.464754104614258,
              50.65065775365173
            ],
            [
              5.427074432373047,
              50.62695156219702
            ],
            [
              5.4274606704711905,
              50.62676099327735
            ],
            [
              5.465140342712402,
              50.6504672808316
            ],
            [
              5.464754104614258,
              50.65065775365173
            ]
          ]
        ]
      }
    }
  ]
};