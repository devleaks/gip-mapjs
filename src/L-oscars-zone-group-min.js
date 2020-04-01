/*
 * LeafletJS Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict"

Oscars = Oscars || {}

Oscars.ZoneGroup = L.GeoJSON.extend({

    options: {

        VERSION: "3.0.0",

        start: false, // no auto-update of GeoJSON.

        getFeatureId: function(feature) {
            return Oscars.Util.getFeatureId(feature, "ZoneGroup::getFeatureId: Warning - Feature has no name, will never be updated or removed")
        },

        style: function(feature) {
            Oscars.Map.setStats('OZGSTY')
            if (feature && feature.properties && feature.properties._style) {
                console.log("case 1", feature, feature.properties._style)
                return feature.properties._style
            } else {
                console.log("case 2", feature, Oscars.Util.getDefaults().STYLE)
                ;//console.log("ZoneGroup::style: Warning - Feature has no style, using default", feature)
            }
            return Oscars.Util.getDefaults().STYLE
        },

        onEachFeature: function(feature, layer) {
            Oscars.Map.setStats('OZGOEF')
            Oscars.Util.bindTexts(feature, layer)
        }

    },

    /**
     *  Merge defaults with user-supplied defaults and install initial collection
     */
    initialize: function(featureCollection, moreoptions) {
        Oscars.Map.setStats('OZGINI')
        L.setOptions(this, this.options)
        if (moreoptions && moreoptions.hasOwnProperty("gipDefaults")) {
            Oscars.Util.setDefaults(moreoptions.gipDefaults)
        }
        L.GeoJSON.prototype.initialize.call(this, featureCollection, this.options)
        Oscars.Map.addLayerToControlLayer(featureCollection, this)
    },

    update: function(geojson) {
        var fids = Oscars.Util.featureIds(geojson)
        console.log("to update", fids)
        var layers_to_delete = []
        var ls = this.getLayers()
        ls.forEach(function(layer, idx) {
            var fid = Oscars.Util.getLayerFeatureId(layer)
            if (fid && fids.indexOf(fid) > -1) {
                console.log("to delete", fid)
                layers_to_delete.push(layer)
            }
        })
        this.addData(geojson)
        const _local_this = this
        layers_to_delete.forEach(function(layer, idx) {
            console.log("deleting layer..", getLayerFeatureId(layer))
            _local_this.removeLayer(layer)
            console.log("..delete")
        })
    }

})

Oscars.zoneGroup = function(src, options) {
    return new Oscars.ZoneGroup(src, options)
}