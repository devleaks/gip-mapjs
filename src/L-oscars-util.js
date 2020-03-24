/*
 * jQuery Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict";

L.Oscars = L.Oscars || {};

L.Oscars.version = '3.0.0';

L.Oscars.Util = (function() {
    /**
     *	DEFAULT VALUES
     */
    // Defaults as used if no default is provided
    var DEFAULT = {
        MARKER_MIN_SIZE: 15, // px
        BACKGROUND_COLOR: "transparent",
        ICON_STYLE: "border: none;",
        TOOLTIP_CLASSNAME: "oscars-label",
        CLEANUP_STATUS: "GIP::INACTIVE",
        TRACK: {
            duration: 10,
            color: '#666', //@todo: Adjust track's color from feature's
            weight: 1, //@set weight from speed or
            dashArray: "2 4" //@build dash array from speed
        },
        SPEED_VECTOR: {
            weight: 2,
            color: '#f30',
            fillOpacity: 0.06,
            vectorLength: 5
        },
        STYLE: {
            markerSymbol: "map-marker",
            markerSize: 24, // px
            markerColor: "rgb(0,128,256)", // lighter blue
            color: "darkgrey", // stroke color
            opacity: 0.6, // stroke opacity 0 = transparent
            weight: 1, // stroke width
            fillColor: "darkgrey", // fill color
            fillOpacity: 0.2, // fill opacity 1 = opaque
            fillPattern: "solid", // fill pattern (currently unused)
            inactiveMarkerColor: "darkgrey"
        },
        MAP: {
            id: "map",
            center: [50.487729, 5.100128], // Oscars sa
            //center: [50.8449933,4.3477891],	// Mannekenpis
            zoom: 15,
            name: "GIP_MAP",
            display_name: "GIP Map",
            layers: null,
            layerControl: null,
            layerControlOptions: { useGrouped: false, groupCheckboxes: true, collapsed: false },
            betterScale: true,
            track: false,
            speedVector: false,
            sidebar: true,
            reset: true,
            info: true,
            search: false,
            wire: false,
            voice: false,
            stylesets: false,
            about: true,
            client: "oscars"
        },
        INFO_ID: "info",
        INFO_CONTENT_ID: "device-info"
    };
    // new defaults
    var options = {};
    /**
     *	PRIVATE VARIABLES
     */
    var _map = null;
    var _mapCenter = null;
    // L.Control for layers
    var _layerControl = null;
    var _layerControlGrouped = false;
    // Hidden layer (container) for features that need searching
    var _searchLayer = null;
    // small graphs
    var _sparklines = {};
    // Track keeping
    var _speedVectorLayer = null;
    var _trackLayer = null;
    var _tracks = {};
    // L.Control for sidebar information
    var _sidebar = null;
    var _showInfo = false;
    // layers temporary hidden through zoom level
    var _hiddenLayers = [];
    // Markers that have a physical size and need adjustments on zoom changes
    var _phyMarkers = {};
    // A few statistics
    var _stats = {};
    //
    var _gipLayers = {};
    // @todo: Replace ids with random strings.
    var _sidebar_id = "sidebar";

    /**
     *	PRIVATE FUNCTIONS
     */
    // Check property existance
    function isSet(property) {
        return typeof property != "undefined" && (property || property === false);
    }

    // Check is object is {} or more
    function isEmpty(obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }

        return JSON.stringify(obj) === JSON.stringify({});
    }

    // Generate random ID for HMTL elements
    function guidGenerator() {
        var S4 = function() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    // Recursively extend/merge js objects properties
    function extend() {
        // Variables
        var extended = {};
        var deep = false;
        var i = 0;
        var length = arguments.length;

        // Check if a deep merge
        if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
            deep = arguments[0];
            i++;
        }

        // Merge the object into the extended object
        var merge = function(obj) {
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    // If deep merge and property is an object, merge properties
                    if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
                        extended[prop] = extend(true, extended[prop], obj[prop]);
                    } else {
                        extended[prop] = obj[prop];
                    }
                }
            }
        };

        // Loop through each object and conduct a merge
        for (; i < length; i++) {
            var obj = arguments[i];
            merge(obj);
        }

        return extended;
    };

    //
    function getDefaults() {
        if (typeof options.STYLE == "undefined") {
            options = extend(true, {}, DEFAULT);
            // Build default icon
            options.ICON = L.BeautifyIcon.icon({
                icon: options.STYLE.markerSymbol,
                textColor: options.STYLE.markerColor,
                innerIconStyle: "font-size: " + options.STYLE.markerSize + 'px;',
                backgroundColor: options.BACKGROUND_COLOR,
                iconStyle: options.ICON_STYLE
            });
            // Build default marker
            options.MARKER = { icon: options.ICON }; // use: var marker = L.marker(latLng(lat,lon), options.MARKER);
        }
        return options;
    }

    // Returns single LeafletJS LatLng object from feature's geometry.
    function getLatLng(feature) {
        return L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
    }

    // Calculate how many meters each pixel represents
    // Used to convert physical size to pixels
    function getMetersPerPixel() {
        if (!_map) return 0;
        var y = _map.getSize().y,
            x = _map.getSize().x;
        // calculate the distance the one side of the map to the other using the haversine formula
        var maxMeters = _map.containerPointToLatLng([0, y]).distanceTo(_map.containerPointToLatLng([x, y]));
        return maxMeters / x;
    }

    // Calculate a feature's pixel dimension from its physical size
    function getFontSizePx(feature) {
        var style = feature.properties._style; //@todo if no style?
        var pixels = 0;
        if (isSet(feature.properties.physicalSize)) {
            var metersPerPixel = getMetersPerPixel();
            if (metersPerPixel > 0) {
                pixels = Math.round(feature.properties.physicalSize / metersPerPixel);
                addResizeMarker(feature);
            }
        } else if (isSet(style.markerSize)) {
            var numMarkerSize = String(style.markerSize).replace(/[^0-9$.,]/g, '');
            pixels = parseInt(style.markerSize) ? parseInt(style.markerSize) : options.STYLE.markerSize;
        }
        return pixels;
    }

    // Returns properly sized & styled icon from Point feature type, status, and display_status.
    function getIcon(feature) {
        if (!isSet(feature.properties._style)) {
            console.log("L.Oscars.Util::getIcon: Warning - Feature has no style, using default", feature);
            feature.properties._style = options.STYLE;
        }
        if (isSet(feature.properties._data)) {
            return getSparkline(feature);
        }
        var style = feature.properties._style;
        var size = getFontSizePx(feature);
        return L.BeautifyIcon.icon({
            icon: (isSet(style.markerSymbol)) ? style.markerSymbol : options.STYLE.markerSymbol,
            textColor: (isSet(style.markerColor)) ? style.markerColor : options.STYLE.markerColor,
            innerIconStyle: "font-size: " + (size < options.MARKER_MIN_SIZE ? options.MARKER_MIN_SIZE : size) + 'px;',
            backgroundColor: (isSet(style.backgroundColor)) ? style.backgroundColor : options.BACKGROUND_COLOR,
            iconStyle: (isSet(style.iconStyle)) ? style.iconStyle : options.ICON_STYLE
        });
    };

    // Sanitize feature.properties.name to be used as classname.
    function sanitizeClassname(name) {
        return name.replace(/[^a-z0-9]/g, function(s) {
            var c = s.charCodeAt(0);
            if (c == 32) return '-';
            if (c >= 65 && c <= 90) return '_' + s.toLowerCase();
            return '__' + ('000' + c.toString(16)).slice(-4);
        });
    }

    // Returns properly sized & styled icon from Point feature type, status, and display_status.
    function getSparkline(feature) {
        var peityTypeOptions = {
            pie: ['delimiter', 'fill', 'height', 'radius', 'width'],
            donut: ['delimiter', 'fill', 'height', 'radius', 'width', 'innerRadius'],
            bar: ['delimiter', 'fill', 'height', 'max', 'min', 'padding', 'width'],
            line: ['delimiter', 'fill', 'height', 'max', 'min', 'stroke', 'strokeWidth', 'width']
        };
        if (!isSet(feature.properties._data)) {
            console.log("L.Oscars.Util::getSparkline: Warning - Feature has no data", feature);
            return null;
        }
        var name = sanitizeClassname(feature.properties.name);
        var chartType = isSet(feature.properties._data.type) ? feature.properties._data.type : 'pie',
            data = feature.properties._data.values;
        if (['pie', 'donut', 'bar', 'line'].indexOf(chartType) == -1) {
            console.log("L.Oscars.Util::getSparkline: Warning - Invalid chart type, forcing pie", feature);
            chartType = 'pie';
        }
        if (Array.isArray(data))
            data = data.join();

        var icon = L.divIcon({
            html: isSet(feature.properties._data.options) ? '<span class="' + name + '" data-peity=\'' + JSON.stringify(feature.properties._data.options) + '\'>' + data + '</span>' : '<span class="' + name + '">' + data + '</span>',
            className: 'leafletjs-peity' // removes bg and border
        });
        _sparklines[name] = chartType;
        jQuery(document).ready(function($) {
            $('.' + name).peity(chartType);
        });
        return icon;
    };

    // Install click events
    function bindTexts(feature, layer) {
        var showLabel = function(f) {
            return isSet(f.properties._templates) && isSet(f.properties._templates.show_label) && f.properties._templates.show_label;
        }

        if (isSet(feature.properties) && isSet(feature.properties._templates)) {
            var bound = [];
            feature.properties._texts = feature.properties._texts || {};
            ["linkText", "linkURL", "label", "tooltip", "popup", "sidebar"].forEach(function(s) {
                var text = (typeof(feature.properties._texts[s]) != "undefined") ? feature.properties._texts[s] : null;
                if (typeof(feature.properties._templates[s]) != "undefined" && feature.properties._templates[s] != null && !text) {
                    feature.properties._texts[s] = Mustache.render(feature.properties._templates[s], {
                        feature: feature,
                        templates: feature.properties._templates || {},
                        texts: feature.properties._texts || {}
                    });
                }
                // if some text, use it for its purpose
                if (feature.properties._texts[s]) {
                    switch (s) {
                        case "label": // only one of label or tooltip. First one gets installed, second one does not get installed. Label gets tested first.
                            if (!layer.getTooltip() && showLabel(feature)) {
                                layer.bindTooltip(feature.properties._texts.label, { direction: "center", className: "oscars-label", permanent: true });
                                bound.push(s);
                            }
                            break;
                        case "tooltip":
                            if (!layer.getTooltip()) {
                                layer.bindTooltip(feature.properties._texts.tooltip, { direction: "top", className: "oscars-tooltip", permanent: false });
                                bound.push(s);
                            }
                            break;
                        case "popup":
                            layer.bindPopup(feature.properties._texts.popup);
                            bound.push(s);
                            break;
                        case "sidebar":
                            if (_showInfo) {
                                layer.on("contextmenu", function onClick(e) {
                                    var defs = getDefaults();
                                    if (isSet(feature.properties._texts.sidebar)) {
                                        _sidebar.setContent(feature.properties._texts.sidebar);
                                        _sidebar.open(defs.INFO_ID);
                                    } else {
                                        console.log("L.Oscars.Util::bindTexts: Warning - No sidebar text.", feature);
                                    }
                                });
                                bound.push(s);
                            }
                            break;
                    }
                    feature.properties._bound = bound.join(); // mainly for debug
                }
            });
        }

    }

    // Draws a vector in front of oriented icon to show potential displacement before next anticipated update
    function getVector(feature) {
        if (feature.properties.heading != null) { // if there is a heading
            var opts = getDefaults();
            opts.SPEED_VECTOR.clickable = false;
            if (feature.properties.speed != null) { feature.length = feature.properties.speed * opts.SPEED_VECTOR.vectorLength; } // and a speed
            if (feature.length != null && feature.length > 0) {
                var ll = getLatLng(feature);
                var x = ll.lng; // X coordinate
                var y = ll.lat * 1; // Y coordinate
                var ll1 = ll;
                var angle = feature.properties.heading * 1;
                var lengthAsDegrees = feature.length / 110540; // metres in a degree..ish
                var polygon = null;
                if (feature.properties.accuracy != null) {
                    feature.properties.accuracy = Number(feature.properties.accuracy);
                    var y2 = y + Math.sin((90 - angle + feature.properties.accuracy) / 180 * Math.PI) * lengthAsDegrees * Math.cos(y / 180 * Math.PI);
                    var x2 = x + Math.cos((90 - angle + feature.properties.accuracy) / 180 * Math.PI) * lengthAsDegrees;
                    var ll2 = new L.LatLng(y2, x2);
                    var y3 = y + Math.sin((90 - angle - feature.properties.accuracy) / 180 * Math.PI) * lengthAsDegrees * Math.cos(y / 180 * Math.PI);
                    var x3 = x + Math.cos((90 - angle - feature.properties.accuracy) / 180 * Math.PI) * lengthAsDegrees;
                    var ll3 = new L.LatLng(y3, x3);
                    polygon = L.polygon([ll1, ll2, ll3], opts.SPEED_VECTOR);
                } else {
                    var ya = y + Math.sin((90 - angle) / 180 * Math.PI) * lengthAsDegrees * Math.cos(y / 180 * Math.PI);
                    var xa = x + Math.cos((90 - angle) / 180 * Math.PI) * lengthAsDegrees;
                    var lla = new L.LatLng(ya, xa);
                    polygon = L.polygon([ll1, lla], opts.SPEED_VECTOR);
                }
                return polygon;
            }
        }
        return null;
    }

    // Compute rotation if requested
    function getRotation(feature) {
        var style = feature.properties._style;
        var rotation = 0.0;
        var notdone = true;
        if (isSet(style.markerRotationOffset)) { // has rotation offset = need to rotate icon
            rotation = parseFloat(style.markerRotationOffset);
            ['heading', 'bearing', 'orientation', 'orient'].forEach(function(prop) {
                if (isSet(feature.properties[prop]) && notdone) { // has rotation
                    rotation += parseFloat(feature.properties[prop]);
                    notdone = false;
                }
            });
        }
        return rotation;
    }

    // Returns oriented marker with icon for Point feature. Always returns a marker (defaults if needed).
    function getMarker(feature) {
        // Get styled icon or sparkline graph. If feature contains data, icon is always regenerated (sparkline from data).
        if (!isSet(feature.properties._icon) || isSet(feature.properties._data)) {
            feature.properties._icon = getIcon(feature);
        }

        var markerOptions = {
            icon: feature.properties._icon
        };

        // Add vector
        var vector = getVector(feature);
        if (vector) {
            markerOptions.vector = vector;
        }

        // Rotate marker
        var rotation = getRotation(feature);
        if (rotation != 0.0) {
            markerOptions.rotationAngle = rotation;
        }

        // Assemble marker appearance and behavior
        var layer = L.marker(getLatLng(feature), markerOptions);

        // Add texts
        bindTexts(feature, layer);

        // Add vector
        if (vector && _speedVectorLayer) {
            layer.on("add", function(e) {
                    if (this.options.vector) this.options.vector.addTo(_speedVectorLayer);
                })
                .on("remove", function(e) {
                    if (this.options.vector) {
                        _speedVectorLayer.removeLayer(this.options.vector);
                        delete this.options.vector;
                    }
                });
        }

        return layer ? layer : L.marker(latlng, options.MARKER);
    }

    // Keep track of marker to resize on zoom in/out
    function addResizeMarker(feature) {
        _phyMarkers[feature.properties.name] = feature;
    }

    // Resizes physical sized markers upon zoom change.
    function resizeMarkers(e) {
        for (var fname in _phyMarkers) {
            if (_phyMarkers.hasOwnProperty(fname)) {
                //safari bug?
                var feature = typeof _phyMarkers[fname].feature == "undefined" ? _phyMarkers[fname] : _phyMarkers[fname].feature;
                delete feature.properties._icon; // needs to recreate it with proper size
                feature.properties._layer.update(feature);
            }
        }
    }

    /**
	 *  0 ... ... MIN ... ... ... MAX ... ... 18
	 *                  ZOOM
	 *	!! No check on zoom_min and zoom_max values !!
		L.polyline([
		        [-41.28313, 174.77736],
		        [-41.2895, 174.77803],
		        [-41.29042, 174.78219],
		        [-41.29437, 174.78405]
	        ],
			{
				zoom_min: 12,
				zoom_max: 14
			}
        ).addTo(_map);
	 */
    function showHideLayers() {
        if (!_map) return;
        var doneSomething = false;
        var mapZoom = _map.getZoom();
        resizeMarkers();

        // Do hidden layers need showing?
        _hiddenLayers.forEach(function(layer) {
            var indexOfHiddenLayer = _hiddenLayers.indexOf(layer);
            if (isSet(layer.options.zoom_min)) {
                if (layer.options.zoom_min <= mapZoom) {
                    if (_map.hasLayer(layer) == false) { // not necessary
                        _map.addLayer(layer);
                        if (indexOfHiddenLayer > -1) {
                            _hiddenLayers.splice(indexOfHiddenLayer, 1);
                        }
                        doneSomething = true;
                    }
                }
            }
            if (isSet(layer.options.zoom_max)) {
                if (layer.options.zoom_max >= mapZoom) {
                    if (_map.hasLayer(layer) == false) { // not necessary
                        _map.addLayer(layer);
                        if (indexOfHiddenLayer > -1) {
                            _hiddenLayers.splice(indexOfHiddenLayer, 1);
                        }
                        doneSomething = true;
                    }
                }
            }
        });

        // Do visible layers need hiding?
        _map.eachLayer(function(layer) {
            if (isSet(layer.options.zoom_min)) {
                if (layer.options.zoom_min > mapZoom) {
                    if (_map.hasLayer(layer)) {
                        _hiddenLayers.push(layer);
                        _map.removeLayer(layer);
                        doneSomething = true;
                    }
                }
            }
            if (isSet(layer.options.zoom_max)) {
                if (layer.options.zoom_max < mapZoom) {
                    if (_map.hasLayer(layer)) {
                        _hiddenLayers.push(layer);
                        _map.removeLayer(layer);
                        doneSomething = true;
                    }
                }
            }
        });

        if (doneSomething) { // provoque layer redraw
            L.Oscars.Util.updateSparklines();
            _map.invalidateSize();
        }
    }

    // Add sidebar tab and content
    function addSidebarTab(options) {
        var content = $('<p>');
        if (!!isSet(options.nocontent) || !options.nocontent) {
            content = (isSet(options.wrap) && !options.wrap) ? options.tab_content :
                $('<div>')
                .addClass("card")
                .append($('<div>')
                    .addClass("card-body")
                    .html(options.tab_content));
        }

        var tab = document.createElement('i')
        $(tab).addClass(options.client)
            .addClass('la')
            .addClass('la-' + options.icon)
            .append(options.icon_extra)

/*
		// 2. Add tab content
		if(isSet(options.nocontent) && options.nocontent) return;
		var content = (isSet(options.wrap) && !options.wrap) ? options.tab_content :
			$('<div>')
				.addClass("card")
				.append( $('<div>')
					.addClass("card-body")
					.html( options.tab_content ) )
		;
		$('#'+_sidebar_id+" div.sidebar-content")
			.append($('<div>')
				.addClass('sidebar-pane')
				.attr('id', options.id)
				.append( $('<h1>')
					.addClass("sidebar-header")
					.addClass(options.client)
					.html(options.title)
					.append( $('<span>')
						.addClass('sidebar-close')
						.append( $('<i>')
							.addClass('fa')
							.addClass('fa-remove') ) ) )
				.append( $('<h2>')
					.addClass("sidebar-header")
					.html(options.subtitle) )
				.append( $('<div>')
					.addClass("sidebar-pane-content")
					.append( content )
				)
			)
*/
        _sidebar.addPanel({
            id: options.id,
            title: options.title ? options.title : "",
            tab: tab.outerHTML,
            pane: $(options.tab_content).html(),
            position: (options.hasOwnProperty("zone") && options.zone == 2) ? 'bottom' : 'top'
        })
    }

    /**
     *	PUBLIC INTERFACE
     */
    return {
        // 	Create leaflet map and pass it to prepareMap.
        map: function(args) {
            var defs = getDefaults(); // init
            var opts = extend(true, defs.MAP, args)
            var map = L.map(opts.id, {
                center: opts.center,
                zoom: opts.zoom,
                layers: opts.layers,
                attributionControl: false
            });
            return L.Oscars.Util.prepareMap(map, args);
        },

        // 	Build leaflet map. Hides numerous installation call.
        prepareMap: function(map, args) {
            var defs = getDefaults(); // init
            var opts = extend(false, defs.MAP, args);
            var client = opts.client;

            L.Oscars.Util.versions();

            if (!map) return L.Oscars.Util.map(args);

            _map = map;

            var mapLoc = $('#' + opts.id);

            // Checks map params and install map items
            if (!mapLoc.length) {
                console.log("L.Oscars.Util::prepareMap: Error - cannot find map at #" + opts.id);
                //throw "L.Oscars.Util::prepareMap: Error - cannot find map at #" + opts.id;
                return _map;
            }
            if (opts.sidebar) {
                const SIDEBARCONTENTID = "leafletsidebarcontentidcannotscroll"
                mapLoc.prepend($('<div>')
                    .attr("id", _sidebar_id)
                    .addClass("client")
                    .addClass("leaflet-sidebar")
                    .addClass("collapsed")
                    .append($('<div>')
                        .addClass("leaflet-sidebar-tabs")
                        .append($('<ul>')
                            .attr("role", "tablist")))
                    .append($('<div id="' + SIDEBARCONTENTID + '">')
                        .addClass("leaflet-sidebar-content")));

                // see https://gis.stackexchange.com/questions/151310/leaflet-scroll-wheel-controlling-map-zoom-and-not-drop-down-menu
                var elem = L.DomUtil.get(SIDEBARCONTENTID);
                L.DomEvent.on(elem, 'mousewheel', L.DomEvent.stopPropagation);

                // Wrap elements in side bar if requested
                _sidebar = L.control.sidebar({
                    container: _sidebar_id,
                    position: 'right',
                    closeButton: true
                }).addTo(map);

                if (typeof _sidebar.setContent == "undefined") {
                    _sidebar.setContent = function(content) {
                        var container = L.DomUtil.get(defs.INFO_CONTENT_ID);
                        container.innerHTML = content;
                    };
                    _sidebar.resetContent = function() {
                        _sidebar.setContent('');
                    };
                }

            }

            if (!isSet(_map.options.center) && !isSet(_map.options.zoom) && isSet(opts.center) && isSet(opts.zoom)) {
                _mapCenter = {
                    center: opts.center,
                    zoom: opts.zoom
                }
                _map.setView(opts.center, opts.zoom);
            }

            _map.on('zoomend', showHideLayers);

            // Layer Control always present, may be moved to sidebar if present.
            var lclfun = L.control.layers;
            if (isSet(opts.layerControlOptions) && opts.layerControlOptions.useGrouped) {
                _layerControlGrouped = true;
                lclfun = L.control.groupedLayers;
            }

            if (isSet(args) && isSet(args.layerControl)) {
                _layerControl = lclfun(args.layerControl.baseLayers,
                    args.layerControl.overlays,
                    isSet(args.layerControl.options) ? args.layerControl.options : opts.layerControlOptions);
            } else {
                _layerControl = lclfun(null, null, opts.layerControlOptions);
            }

            _layerControl.addTo(_map)

            _layerControl.addGipOverlay = function(layer, layerName, groupName) {
                if (_layerControlGrouped) {
                    _layerControl.addOverlay(layer, layerName, groupName);
                } else {
                    _layerControl.addOverlay(layer, layerName);
                }
            }


            if (opts.track) {
                _trackLayer = L.layerGroup().addTo(_map);
                _layerControl.addGipOverlay(_trackLayer, "Trails", "Trackers");
            }

            if (opts.speedVector) {
                _speedVectorLayer = L.layerGroup().addTo(_map);
                _layerControl.addGipOverlay(_speedVectorLayer, "Speed Vectors", "Trackers");
            }

            if (opts.betterScale) {
                L.control.betterscale({ metric: true, imperial: false, position: "bottomleft" }).addTo(_map); // either one or the other but not both
            } else {
                L.control.scale().addTo(_map);
            }
            _map.zoomControl.setPosition('bottomleft');

            // Add top sidebar elements
            if (opts.sidebar) {
                const LAYERCONTROLID = 'layer-control'
                addSidebarTab({
                    client: client,
                    zone: 1,
                    id: "layers",
                    title: "Layers",
                    info: "Layers",
                    subtitle: "&nbsp;",
                    icon: "bars",
                    icon_extra: null,
                    tab_content: $('<div>')
                    		.append($('<div>')
                    			.attr("id", LAYERCONTROLID))
                });
                // relocate layer control to sidebar
                var newloc = document.getElementById(LAYERCONTROLID);
                newloc.appendChild(_layerControl._container);
            }

            if (opts.sidebar && opts.reset) {
                addSidebarTab({
                    client: client,
                    zone: 1,
                    id: "location",
                    title: "Reset Map",
                    info: "Center Map",
                    subtitle: "&nbsp;",
                    icon: "home",
                    icon_extra: null,
                    tab_content: null,
                    nocontent: true
                });
            }

            if (opts.sidebar && opts.info) {
                addSidebarTab({
                    client: client,
                    zone: 1,
                    id: defs.INFO_ID,
                    title: "Info",
                    info: "Info",
                    subtitle: "&nbsp;",
                    icon: "info-circle",
                    icon_extra: null,
                    tab_content: $('<div>')
                    		.append($('<div>')
                    			.attr("id", defs.INFO_CONTENT_ID)
                    			.append("Right-click/Control-click on device icon to read more information here."))

                });
                _showInfo = true;
            }

            if (opts.search) {
                const SEARCHCONTROLID = 'search-control'
                addSidebarTab({
                    client: client,
                    zone: 1,
                    id: "search",
                    title: "Search",
                    info: "Search",
                    subtitle: "&nbsp;",
                    icon: "search",
                    icon_extra: null,
                    tab_content: $('<div>')
                    		.append($('<div>')
                    			.attr("id", SEARCHCONTROLID))
                });
                _searchLayer = L.layerGroup();
                var searchControlOptions = opts.sidebar ? {
                    layer: _searchLayer,
                    propertyName: "name",
                    container: SEARCHCONTROLID,
                    collapsed: false,
                    textPlaceholder: 'Search...                ',
                    marker: { icon: L.icon.pulse({ iconSize: [12, 12], color: 'red' }), animate: false, circle: false },
                } : {
                    layer: _searchLayer,
                    propertyName: "name",
                    textPlaceholder: 'Search...                ',
                    marker: { icon: L.icon.pulse({ iconSize: [12, 12], color: 'red' }), animate: false, circle: false },
                };
                _map.addControl(new L.Control.Search(searchControlOptions));
            }

            if (opts.sidebar && opts.wire) {
                addSidebarTab({ //id, title, subtitle, icon, zone, icon_extra, tab_content
                    client: client,
                    id: "messages",
                    zone: 1,
                    title: 'Messages<span class="clean-wire"><i class="fa fa-trash-o"></i>&nbsp;</span>' +
                        '				<span class="sound-onoff"><i class="fa"></i>&nbsp;</span>',
                    info: 'Wire Messages',
                    subtitle: "Last Updated:&nbsp;<span id='last-updated-time'>just now</span>",
                    icon: "envelope",
                    icon_extra: "<span id='alert-counter' class='badge " + client + "'>0</span></a>",
                    tab_content: $('<div>')
                    		.append($('<div>')
	                        .attr("id", "gip-gip-wire")
	                        .append($('<header>')
	                            .addClass("wire-top")
	                            .append($('<div>')
	                                .addClass("wire-seave"))
	                            .append($('<div>')
	                                .addClass("wire-tagsort")
	                                .append($('<div>')
	                                    .addClass("tagsort-tags-container"))))
	                        .append($('<div>')
	                            .addClass("wire-tagsort")
	                            .append($('<ul>')
	                                .attr("id", "the-wire")
	                                .addClass("timeline")
	                                .addClass("collapse-lg")
	                                .addClass("timeline-hairline")
	                                .addClass("cd-timeline")))),
                    wrap: false
                });
                L.Oscars.Dashboard.init({
                    map_id: opts.id,
                    websocket: 'ws://localhost:8051'
                });
                L.Oscars.Dashboard.Wire.init({ // @todo: set wire elem id from sidebarHTML.
                    map_id: opts.id,
                    debug: false,
                    voice: false
                });
            }

            // Add bottom of sidebar elements
            if (opts.sidebar && opts.stylesets) {
                addSidebarTab({
                    client: client,
                    zone: 2,
                    id: "settings",
                    title: "Preferences",
                    info: "Preferences",
                    subtitle: "&nbsp;",
                    icon: "gear",
                    icon_extra: null,
                    tab_content: $('<div>')
                    	.append($('<form>')
                        .addClass("form")
                        .append($('<label>')
                            .attr("for", "styleselect")
                            .addClass("form-control")
                            .html("Style set&nbsp;:&nbsp;&nbsp;"))
                        .append($('<select>')
                            .attr("id", "styleselect")
                            .attr("name", "styleset")
                            .addClass("form-control")))
                });
                for (var opt in opts.stylesets) {
                    if (opts.stylesets.hasOwnProperty(opt)) {
                        $('#styleselect').append( //<option value="DEFAULT" selected>Default</option>
                            $('<option>').attr('value', opt).html(opts.stylesets[opt])
                        );
                    }
                }
            }

            if (opts.sidebar && opts.about) {
                var aboutOptions = {
                    client: client,
                    zone: 2,
                    id: "about",
                    title: "About Oscars GIP Viewer",
                    info: "About Oscars GIP Viewer",
                    subtitle: "&nbsp;",
                    icon: null,
                    icon_extra: '<span class="about ' + client + '" title="About GIP..."></span>',
                    tab_content: '<div class="card" style="text-align: center;">' +
                        '	<div class="card-body">' +
                        '		<div class="la-logo"></div>' +
                        '	</div>' +
                        '	<div class="card-body">' +
                        '		<div class="gip-logo"></div>' +
                        '	</div>' +
                        '	<div>' +
                        '		<header>Our map is using these libraries:</header>' +
                        '	</div>' +
                        '	<div class="card-body">' +
                        '		<table class="oscars-credits">' +
                        '<tr>' +
                        '	<td><div class="leafletjs-logo"></div></td>' +
                        '	<td>A JavaScript library for interactive maps.</td>' +
                        '</tr>' +
                        '<tr>' +
                        '	<td><div class="mapbox-logo"></div></td>' +
                        '	<td>The location platform for developers and designers.</td>' +
                        '</tr>' +
                        '<tr>' +
                        '	<td><div class="osm-logo"></div></td>' +
                        '	<td>A map of the world, created by people, and free to use under an open license.</td>' +
                        '</tr>' +
                        '<tr>' +
                        '	<td><div class="stamen-logo"></div></td>' +
                        '	<td>A library of awesome styles for OpenStreetMap data.</td>' +
                        '</tr>' +
                        '		</table>' +
                        '	</div>' +
                        '</div>' +
                        '<div style="font-size: smaller;margin-top:20px;text-align:center;">' +
                        '	&copy; ' + (new Date()).getFullYear() + ' — Oscars s.a. and respective lisensees.' +
                        '</div>',
                    wrap: false
                };
                addSidebarTab(aboutOptions);
            }

            // must be done last
            var resetloc = $('.leaflet-sidebar-tabs a[href="#location"]');
            if (resetloc.length > 0) {
                resetloc.click(function(event) {
                    event.preventDefault();
                    L.Oscars.Util.resetLocation();
                });
            }

            return _map;
        },

        resetLocation: function() {
            if (isSet(_mapCenter)) {
                _map.setView(_mapCenter.center, _mapCenter.zoom);
            } else if (isSet(_map.options.center) && isSet(_map.options.zoom)) {
                _map.setView(_map.options.center, _map.options.zoom);
            }
            if (_sidebar)
                _sidebar.close();
        },

        updateSparklines: function() {
            jQuery(document).ready(function($) {
                for (var name in _sparklines) {
                    if (_sparklines.hasOwnProperty(name))
                        $('.' + name).peity(_sparklines[name]);
                }
            });
        },

        // Get or generate a feature id
        getFeatureId: function(feature, errmsg) {
            if (feature.hasOwnProperty("id")) {
                return feature.id
            }
            // creates feature.id since it does not exist
            if (feature && feature.hasOwnProperty("properties")) {
                var fp = feature.properties
                if (fp.hasOwnProperty("id")) {
                    feature.id = fp.id
                    return feature.id
                } else if (fp.hasOwnProperty("name")) {
                    feature.id = fp.name
                    return feature.id
                }
            }
            console.log(errmsg, feature);
            feature.id = L.Oscars.Util.uuidv4()
            return feature.id
        },

        // Generates random UUID (https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript)
        uuidv4: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        // Returns serach layer to add/remove layers.
        searchLayer: function() {
            return _searchLayer;
        },

        // returns default values for styles, icons, markers
        getDefaults: function() {
            return getDefaults();
        },

        // Merge supplied values with defaults but does not change defaults.
        mergeOptions: function(d) {
            return extend(true, options, d);
        },

        // Set default values.
        setDefaults: function(d) {
            options = extend(true, options, d);
            return options;
        },

        // Set feature.properties._timestamp to now().	
        touch: function(feature) {
            feature.properties._timestamp = Date.now();
        },

        // Return icon for (Point) feature.	
        bindTexts: function(feature, layer) {
            bindTexts(feature, layer);
        },

        // Return icon for (Point) feature.	
        getIcon: function(feature) {
            return getIcon(feature);
        },

        // Return marker for (Point) feature.
        getMarker: function(feature) {
            var dummy = getDefaults();
            return getMarker(feature);
        },

        // Check for GIP-valid feature.
        // 1. It must be a geojson feature and its geometry must either by a point or a polygon.
        // 2. It must have the following properties set:
        //		2.1. properties.name
        //		2.2. properties.type
        isValidGIPGeoJSONFeature: function(feature) {
            /*
            var errs = geojsonhint.hint(feature, {
                precisionWarning: false
            });
            return errs.length == 0;
            */
            if (isSet(feature.properties) ? (isSet(feature.properties.name) && isSet(feature.properties.type)) : false) {
                return (["Point", "Polygon"].indexOf(feature.geometry.type) > -1);
            }
            console.log('L.Oscars.Util::isValidGIPGeoJSON: Invalid GIP feature', feature);
            return false;
        },

        // Adds a layer to the supplied control layer. If the device/zone groups has a "grouping category", places it in,
        // otherwise, uses generic Devices/Zones groups.
        addLayerToControlLayer: function(featureCollection, layer) {
            var layer_group_display_name, display_name, name;
            if (featureCollection.type == "FeatureCollection") {
                var type = "Devices";
                if (featureCollection.features.length > 0) {
                    type = (featureCollection.features[0].geometry.type == "Point") ? "Devices" : "Zones";
                }
                layer_group_display_name = isSet(featureCollection.properties) && isSet(featureCollection.properties.layer_group_display_name) ? featureCollection.properties.layer_group_display_name : type;
                display_name = featureCollection.properties.display_name;
                name = featureCollection.properties.name;
            } else if (Array.isArray(featureCollection) && featureCollection.length > 0) { // collections of features gets the name of the type of the first element
                layer_group_display_name = (featureCollection[0].geometry.type == "Point") ? "Devices" : "Zones";
                display_name = isSet(featureCollection[0].properties.display_type) ? featureCollection[0].properties.display_type : featureCollection[0].properties.type;
                name = isSet(featureCollection[0].properties.group_name) ? featureCollection[0].properties.group_name : null;
            } else { // layers from one element gets the name from that element
                layer_group_display_name = (featureCollection.geometry.type == "Point") ? "Devices" : "Zones";
                display_name = featureCollection.properties.display_name;
                name = featureCollection.properties.name;
            }
            if (_layerControl) {
                _layerControl.addGipOverlay(layer, display_name, layer_group_display_name);
                if (name) {
                    //console.log('L.Oscars.Util::addLayerToControlLayer: Info - Adding', name);
                    _gipLayers[name] = layer;
                } else {
                    console.log('L.Oscars.Util::addLayerToControlLayer: featureCollection has no group name', featureCollection);
                }
            } else {
                console.log('L.Oscars.Util::addLayerToControlLayer: _layerControl not set', featureCollection);
            }
        },

        addToSearch: function(layer) {
            if (_searchLayer) {
                _searchLayer.addLayer(layer);
            }
        },

        findGIPLayer: function(name) {
            return _gipLayers[name];
        },

        track: function(feature) { //@todo: When removing feature, remove its track by calling untrack
            if (_trackLayer) {
                if (feature.geometry.type != "Point") return;
                var defs = getDefaults();
                if (!isSet(_tracks[feature.properties.name])) {
                    _tracks[feature.properties.name] = L.polyline([getLatLng(feature)], defs.TRACK);
                    _trackLayer.addLayer(_tracks[feature.properties.name]);
                } else {
                    var ll = _tracks[feature.properties.name].getLatLngs();
                    if (ll.length > defs.TRACK.duration) {
                        ll.splice(0, 1);
                        _tracks[feature.properties.name].setLatLngs(ll);
                    }
                    _tracks[feature.properties.name].addLatLng(getLatLng(feature));
                }
            }
        },

        untrack: function(feature) {
            if (_trackLayer && isSet(_tracks[feature.properties.name])) {
                _trackLayer.removeLayer(_tracks[feature.properties.name]);
                delete _tracks[feature.properties.name];
            }
        },

        setStats: function(statname) {
            if (typeof _stats[statname] == "undefined") {
                _stats[statname] = 0;
            }
            _stats[statname]++;
        },

        getStats: function() {
            var features = {};
            _map.eachLayer(function(layer) {
                if (layer instanceof L.GeoJSON) {
                    var fc = layer.toGeoJSON();
                    features[L.Util.stamp(layer)] = fc.features.length;
                }
            });

            return {
                features: features,
                updates: _stats,
                timestamp: (new Date().getTime())
            };
        },

        addDeviceGroup: function(featureCollection, options) {
            var l = L.Oscars.deviceGroup(featureCollection, options);
            // l.addTo(this._map);
            L.Oscars.Util.addLayerToControlLayer(featureCollection, l);
            return l;
        },

        addZoneGroup: function(featureCollection, options) {
            var l = L.Oscars.zoneGroup(featureCollection, options);
            // l.addTo(this._map);
            L.Oscars.Util.addLayerToControlLayer(featureCollection, l);
            return l;
        },

        versions: function() {
            console.log('L version ', L.version);
            console.log('L.Oscars version ', L.Oscars.version);
        }
    };

})();

// install prepareMap into L.Map object for Vaadin/GWT
L.Map.prototype.prepareMap = function(options) { return L.Oscars.Util.prepareMap(this, options); }