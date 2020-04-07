/*
 * LeafletJS Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict";

L.Oscars = L.Oscars || {};

L.Oscars.DeviceGroup = L.Realtime.extend({

    options: {

        start: false,

        getFeatureId: function(feature) {
            return L.Oscars.Util.getFeatureId(feature, "L.Oscars.DeviceGroup::getFeatureId: Warning - Feature has no id")
        },

        style: function(feature) {
            L.Oscars.Util.setStats('ODGSTY');
            if (feature && feature.properties && feature.properties._style) {
                return feature.properties._style;
            } else {
                console.log("L.Oscars.DeviceGroup::style: Warning - Feature has no style, using default", feature);
            }
            return L.Oscars.Util.getDefaults().STYLE;
        },

        pointToLayer: function(feature, latlng) {
            L.Oscars.Util.setStats('ODGP2L');
            L.Oscars.Util.touch(feature);
            feature.properties = feature.properties || {};
            feature.properties._marker = L.Oscars.Util.getMarker(feature);
            return feature.properties._marker;
        },

        updateFeature: function(feature, oldLayer) {
            L.Oscars.Util.setStats('ODGUPF');
            L.Oscars.Util.touch(feature);
            feature.properties = feature.properties || {};
            feature.properties._icon = L.Oscars.Util.getIcon(feature);
        }

    },

    /**
     *  Merge defaults with user-supplied defaults and install initial collection
     */
    initialize: function(featureCollection, options) {
        L.Oscars.Util.setStats('ODGINI');
        L.setOptions(this, options);
        if (options && typeof options.gipDefaults != "undefined") { L.Oscars.Util.setDefaults(options.gipDefaults); }
        L.Realtime.prototype.initialize.call(this, {}, this.options);
        this.update(featureCollection);
        L.Oscars.Util.addLayerToControlLayer(featureCollection, this);
        if (options && typeof options.search != "undefined" && options.search) { L.Oscars.Util.addToSearch(this); }
        this.on("add", L.Oscars.Util.updateSparklines);
    },

    /**
     *  For each item, determine its appearance and sends it for display/update.
     *  Set a pointer to this layer into each feature.
     */
    update: function(geojson_in) {
        L.Oscars.Util.setStats('ODGUPD');
        var geojson = (typeof geojson_in === 'string' || geojson_in instanceof String) ? JSON.parse(geojson_in) : geojson_in;
        var that = this;
        if (geojson.type == "FeatureCollection") {
            geojson.features.forEach(function(feature) {
                feature.properties = feature.properties || {};
                feature.properties._layer = that;
                L.Oscars.Util.track(feature);
            });
            L.Realtime.prototype.update.call(this, geojson.features);
        } else if (Array.isArray(geojson)) {
            geojson.forEach(function(feature) {
                feature.properties = feature.properties || {};
                feature.properties._layer = that;
                L.Oscars.Util.track(feature);
            });
            L.Realtime.prototype.update.call(this, geojson);
        } else {
            geojson.properties = geojson.properties || {};
            geojson.properties._layer = that;
            L.Oscars.Util.track(geojson);
            L.Realtime.prototype.update.call(this, geojson);
        }
    },

    // Experimental, but should be performed in the app server, not here.
    cleanUp: function() {
        var now = Date.now();
        for (var fid in this._features) {
            L.Oscars.Util.setStats('ODGCLU');
            if (this._features.hasOwnProperty(fid)) {
                var feature = this._features[fid];
                var ts = feature.properties._timestamp;
                if (this.options.greyOut) {
                    var cleanUpStatus = L.Oscars.Util.getDefaults().CLEANUP_STATUS;
                    if (((ts + this.options.greyOut) < now) && (feature.properties.status != cleanUpStatus)) {
                        L.Oscars.Util.setStats('ODGCLG');
                        console.log('L.Oscars.DeviceGroup::cleanUp: Info - Inactive ', feature.properties.name);
                        feature.properties.status = cleanUpStatus;
                        feature.properties._style.markerColor = L.Oscars.Util.getDefaults().STYLE.inactiveMarkerColor;
                        delete feature.properties._icon;
                        L.Realtime.prototype.update.call(this, feature);
                    }
                }
                if (this.options.takeOut) {
                    if ((ts + this.options.takeOut) < now) {
                        L.Oscars.Util.setStats('ODGCLR');
                        console.log('L.Oscars.DeviceGroup::cleanUp: Info - Remove ', feature.properties.name);
                        this.remove(feature);
                    }
                }
            }
        };
    }

});

L.Oscars.deviceGroup = function(src, options) {
    return new L.Oscars.DeviceGroup(src, options);
};