var eblgParkings1 = {
  "type": "FeatureCollection",
  "properties" : {
	"name" : "APRONS",
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "stroke": "#555555",
        "stroke-width": 2,
        "stroke-opacity": 1,
        "fill": "#555555",
        "fill-opacity": 0.5,
        "name": "P26",
        "display_name": "26",
        "display_type": "Parking",
        "status": "ACTIVE",
        "display_status": "FREE",
        "type": "APRON",
		"_style": {
		    color: "rgb(0,255,0)",
		    "weight": 1,
		    "opacity": 0.8,
			"fillColor": "rgb(0,255,0)",
		    "fillOpacity": 0.4
		},
		"_templates": {
			"show_label": true,
			"label":	"{{feature.properties.display_name}}"
		}
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              5.460438430309307,
              50.64352129799132
            ],
            [
              5.4606825113296695,
              50.64367778099649
            ],
            [
              5.4601326584816094,
              50.64400605343367
            ],
            [
              5.459901988506329,
              50.64385297330792
            ],
            [
              5.460438430309307,
              50.64352129799132
            ]
          ]
        ]
      }
    }
  ]
};