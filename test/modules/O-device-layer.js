/*
 * LeafletJS Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict"

Oscars = Oscars || {}

Oscars.DeviceGroup = L.Realtime.extend({

    VERSION: "2.1.0",

    options: {

        start: false,

        getFeatureId: function(feature) {
            Oscars.Map.setStats('ODGFID')
            return Oscars.Util.getFeatureId(feature, "DeviceGroup::getFeatureId: Warning - Feature has no name, will never be updated or removed")
        },

        style: function(feature) {
            Oscars.Map.setStats('ODGSTY')
            return Oscars.Util.style(feature)
        },

        pointToLayer: function(feature, latlng) {
            Oscars.Map.setStats('ODGP2L')
            return Oscars.Util.pointToLayer(feature, latlng)
        },

        updateFeature: function(feature, oldLayer) {
            Oscars.Map.setStats('ODGUPF')
            Oscars.Util.updateFeature(feature, oldLayer)
        }

    },

    /**
     *  Merge defaults with user-supplied defaults and install initial collection
     */
    initialize: function(featureCollection, options) {
        Oscars.Map.setStats('ODGINI')
        L.setOptions(this, options)
        if (options && options.hasOwnProperty("gipDefaults")) {
            Oscars.Util.setDefaults(options.gipDefaults)
        }
        L.Realtime.prototype.initialize.call(this, {}, this.options)
        this.update(featureCollection)
        Oscars.Map.addLayerToControlLayer(featureCollection, this)
        if (options && options.hasOwnProperty("search") && options.search) {
            Oscars.Map.addToSearch(this)
        }
        this.on("add", Oscars.Util.updateSparklines)
    },

    /**
     *  For each item, determine its appearance and sends it for display/update.
     *  Set a pointer to this layer into each feature.
     */
    update: function(geojson_in) {
        Oscars.Map.setStats('ODGUPD')

        function addLayer(f, l) {
            f.properties = f.hasOwnProperty("properties") ? f.properties : {}
            f.properties._layer = l
        }
        var geojson = (typeof geojson_in === 'string' || geojson_in instanceof String) ? JSON.parse(geojson_in) : geojson_in
        var that = this

        if (geojson.hasOwnProperty("type") && geojson.type == "FeatureCollection") {
            geojson.features.forEach(function(feature) {
                addLayer(feature, that)
                Oscars.Map.track(feature)
            })
            L.Realtime.prototype.update.call(this, geojson.features)
        } else if (Array.isArray(geojson)) {
            geojson.forEach(function(feature) {
                addLayer(feature, that)
                Oscars.Map.track(feature)
            })
            L.Realtime.prototype.update.call(this, geojson)
        } else if (geojson.hasOwnProperty("type") && geojson.type == "Feature") {
            addLayer(geojson, that)
            Oscars.Map.track(geojson)
            L.Realtime.prototype.update.call(this, geojson)
        } else if (geojson.hasOwnProperty("type") && geojson.type == "Point") {
            var f = L.GeoJSON.asFeature(geojson)
            addLayer(f, that)
            Oscars.Map.track(f)
            L.Realtime.prototype.update.call(this, f)
        } else {
            console.log("DeviceGroup::update: Invalid GeoJSON", geojson_in)
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