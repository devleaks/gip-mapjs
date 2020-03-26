/*
 * LeafletJS Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict"

Oscars = Oscars || {}

Oscars.ZoneGroup = L.Realtime.extend({

    options: {

        VERSION: "2.0.0",

        start: false, // no auto-update of GeoJSON.

        getFeatureId: function(feature) {
            return Oscars.Util.getFeatureId(feature, "ZoneGroup::getFeatureId: Warning - Feature has no name")
        },

        style: function(feature) {
            Oscars.Map.setStats('OZGSTY')
            if (feature && feature.properties && feature.properties._style) {
                return feature.properties._style
            } else {
                console.log("ZoneGroup::style: Warning - Feature has no style, using default", feature)
            }
            return Oscars.Util.getDefaults().STYLE
        },

        onEachFeature: function(feature, layer) {
            Oscars.Map.setStats('OZGOEF')
            Oscars.Util.bindTexts(feature, layer)
        }

    },

    /**
     *	Merge defaults with user-supplied defaults and install initial collection
     */
    initialize: function(featureCollection, options) {
        Oscars.Map.setStats('OZGINI')
        L.setOptions(this, options)
        if (options && options.hasOwnProperty("gipDefaults")) {
            Oscars.Util.setDefaults(options.gipDefaults)
        }
        L.Realtime.prototype.initialize.call(this, {}, this.options)
        this.update(featureCollection)
        Oscars.Map.addLayerToControlLayer(featureCollection, this)
    }

})

Oscars.zoneGroup = function(src, options) {
    return new Oscars.ZoneGroup(src, options)
}