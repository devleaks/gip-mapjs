var eblgAircrafts = {
    "type": "FeatureCollection",
    "properties": {
        "name": "AIRCRAFTS",
        "display_name": "Aircfrafts",
        "type": "AIRCRAFT",
        "display_type": "Aircfraft",
        "status": "ACTIVE"
    },
    "features": [{
            "type": "Feature",
            "properties": {
                "marker-color": "#7E7E7E",
                "marker-size": "medium",
                "marker-symbol": "airport",
                "name": "OO-987",
                "display_name": "A380",
                "type": "AIRCRAFT",
                "display_type": "Aircraft",
                "display_status": "APRON",
                "physicalSize": 60,
                "heading": 137,
                "speed": 0,
                "status": "IDLE",
                "_style": {
                    "markerColor": "rgb(0,0,255)",
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
                            return Date(parseInt(render(text)) * 1000);
                        }
                    },
                    "show_label": true,
                    "tooltip": "{{feature.properties.display_name}}",
                    "popup": "{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
                    "sidebar": "{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}.<br/>" +
                        "Last seen at formated date: {{#templates.formatDate}}" +
                        "{{feature.properties._timestamp}}" +
                        "{{/templates.formatDate}}.<br/>" +
                        "Available {{&texts.linkURL}}.",
                    "linkText": "Link to {{feature.properties.display_name}}",
                    "linkURL": "<a href='#path-to-get-more-details?id={{feature.properties.name}}'>{{texts.linkText}}</a>" // !
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
        {
            "type": "Feature",
            "properties": {
                "marker-color": "#7E7E7E",
                "marker-size": "medium",
                "marker-symbol": "airport",
                "name": "SN123",
                "display_name": "Brussel-Madrid",
                "type": "AIRCRAFT",
                "display_type": "Aircraft",
                "display_status": "AIR",
                "heading": 226,
                "speed": 100,
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
                            return Date(parseInt(render(text)) * 1000);
                        }
                    },
                    "show_label": true,
                    "tooltip": "{{feature.properties.display_name}}",
                    "popup": "{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}",
                    "sidebar": "{{feature.properties.display_name}} is {{feature.properties.display_status}} / {{feature.properties.status}}.<br/>" +
                        "Last seen at formated date: {{#templates.formatDate}}" +
                        "{{feature.properties._timestamp}}" +
                        "{{/templates.formatDate}}.<br/>" +
                        "Available {{&texts.linkURL}}.",
                    "linkText": "Link to {{feature.properties.display_name}}",
                    "linkURL": "<a href='#path-to-get-more-details?id={{feature.properties.name}}'>{{texts.linkText}}</a>" // !
                }
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    5.447126626968384,
                    50.641983654657906
                ]
            }
        }
    ]
};