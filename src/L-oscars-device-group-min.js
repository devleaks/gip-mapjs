/*
 * LeafletJS Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict"

Oscars = Oscars || {}

Oscars.DeviceGroup = L.Realtime.extend({

    VERSION: "2.0.0",
    
    options: {

        start: false,

        getFeatureId: function(feature) {
            return Oscars.Util.getFeatureId(feature, "Oscars.DeviceGroup::getFeatureId: Warning - Feature has no id")
        },

        style: function(feature) {
            Oscars.Map.setStats('ODGSTY')
            if (feature && feature.properties && feature.properties._style) {
                return feature.properties._style
            } else {
                console.log("Oscars.DeviceGroup::style: Warning - Feature has no style, using default", feature)
            }
            return Oscars.Util.getDefaults().STYLE
        },

        pointToLayer: function(feature, latlng) {
            Oscars.Map.setStats('ODGP2L')
            Oscars.Util.touch(feature)
            feature.properties = feature.properties || {}
            feature.properties._marker = Oscars.Util.getMarker(feature)
            return feature.properties._marker
        },

        updateFeature: function(feature, oldLayer) {
            Oscars.Map.setStats('ODGUPF')
            Oscars.Util.touch(feature)
            feature.properties = feature.properties || {}
            feature.properties._icon = Oscars.Util.getIcon(feature)
        }

    },

    /**
     *  Merge defaults with user-supplied defaults and install initial collection
     */
    initialize: function(featureCollection, options) {
        Oscars.Map.setStats('ODGINI')
        L.setOptions(this, options)
        if (options && typeof options.gipDefaults != "undefined") { Oscars.Util.setDefaults(options.gipDefaults) }
        L.Realtime.prototype.initialize.call(this, {}, this.options)
        this.update(featureCollection)
        Oscars.Map.addLayerToControlLayer(featureCollection, this)
        if (options && typeof options.search != "undefined" && options.search) { Oscars.Map.addToSearch(this) }
        this.on("add", Oscars.Util.updateSparklines)
    },

    /**
     *  For each item, determine its appearance and sends it for display/update.
     *  Set a pointer to this layer into each feature.
     */
    update: function(geojson_in) {
        Oscars.Map.setStats('ODGUPD')
        var geojson = (typeof geojson_in === 'string' || geojson_in instanceof String) ? JSON.parse(geojson_in) : geojson_in
        var that = this
        if (geojson.type == "FeatureCollection") {
            geojson.features.forEach(function(feature) {
                feature.properties = feature.properties || {}
                feature.properties._layer = that
                Oscars.Map.track(feature)
            })
            L.Realtime.prototype.update.call(this, geojson.features)
        } else if (Array.isArray(geojson)) {
            geojson.forEach(function(feature) {
                feature.properties = feature.properties || {}
                feature.properties._layer = that
                Oscars.Map.track(feature)
            })
            L.Realtime.prototype.update.call(this, geojson)
        } else {
            geojson.properties = geojson.properties || {}
            geojson.properties._layer = that
            Oscars.Map.track(geojson)
            L.Realtime.prototype.update.call(this, geojson)
        }
    },

    // Experimental, but should be performed in the app server, not here.
    cleanUp: function() {
        var now = Date.now()
        for (var fid in this._features) {
            Oscars.Map.setStats('ODGCLU')
            if (this._features.hasOwnProperty(fid)) {
                var feature = this._features[fid]
                var ts = feature.properties._timestamp
                if (this.options.greyOut) {
                    var cleanUpStatus = Oscars.Util.getDefaults().CLEANUP_STATUS
                    if (((ts + this.options.greyOut) < now) && (feature.properties.status != cleanUpStatus)) {
                        Oscars.Map.setStats('ODGCLG')
                        console.log('Oscars.DeviceGroup::cleanUp: Info - Inactive ', feature.properties.name)
                        feature.properties.status = cleanUpStatus
                        feature.properties._style.markerColor = Oscars.Util.getDefaults().STYLE.inactiveMarkerColor
                        delete feature.properties._icon
                        L.Realtime.prototype.update.call(this, feature)
                    }
                }
                if (this.options.takeOut) {
                    if ((ts + this.options.takeOut) < now) {
                        Oscars.Map.setStats('ODGCLR')
                        console.log('Oscars.DeviceGroup::cleanUp: Info - Remove ', feature.properties.name)
                        this.remove(feature)
                    }
                }
            }
        }
    }

})

Oscars.deviceGroup = function(src, options) {
    return new Oscars.DeviceGroup(src, options)
}