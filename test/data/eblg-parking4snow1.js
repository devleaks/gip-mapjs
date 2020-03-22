var eblgParkings4snow1 = {
  "type": "FeatureCollection",
  "properties" : {
	"name" : "APRONS4SNOW",
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
        "name": "P25",
        "display_name": "25",
        "display_type": "Parking",
        "status": "ACTIVE",
        "display_status": "CLEAN",
        "type": "APRON",
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
              5.4608649015426876,
              50.6437985446986
            ],
            [
              5.461100935935997,
              50.64394992411212
            ],
            [
              5.460551083087944,
              50.644281596403324
            ],
            [
              5.460312366485621,
              50.64412681629209
            ],
            [
              5.4608649015426876,
              50.6437985446986
            ]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "stroke": "#555555",
        "stroke-width": 2,
        "stroke-opacity": 1,
        "fill": "#555555",
        "fill-opacity": 0.5,
        "name": "P24",
        "display_name": "24",
        "display_type": "Parking",
        "status": "ACTIVE",
        "display_status": "CLEAN",
        "type": "APRON",
		"_style": {
		    color: "rgb(0,255,0)",
		    "weight": 1,
		    "opacity": 0,
			"fillColor": "rgb(255,255,0)",
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
              5.461275279521941,
              50.64407408888506
            ],
            [
              5.461500585079191,
              50.64422716829048
            ],
            [
              5.460950732231138,
              50.644552035154256
            ],
            [
              5.460712015628814,
              50.644398956807144
            ],
            [
              5.461275279521941,
              50.64407408888506
            ]
          ]
        ]
      }
    }
  ]
};