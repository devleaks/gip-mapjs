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
            Oscars.Omap.setStats('OZGFID')
            return Oscars.Util.getFeatureId(feature, "ZoneGroup::getFeatureId: Warning - Feature has no name, will never be updated or removed")
        },

        style: function(feature) {
            Oscars.Omap.setStats('OZGSTY')
            return Oscars.Util.style(feature)
        },

        onEachFeature: function(feature, layer) {
            Oscars.Omap.setStats('OZGOEF')
            Oscars.Util.onEachFeature(feature, layer)
        }

    },

    /**
     *  Merge defaults with user-supplied defaults and install initial collection
     */
    initialize: function(featureCollection, moreoptions) {
        Oscars.Omap.setStats('OZGINI')
        L.setOptions(this, this.options)
        if (moreoptions && moreoptions.hasOwnProperty("gipDefaults")) {
            Oscars.Util.setDefaults(moreoptions.gipDefaults)
        }
        L.GeoJSON.prototype.initialize.call(this, featureCollection, this.options)
        Oscars.Omap.addLayerToControlLayer(featureCollection, this)
    },

    update: function(geojson) { // this is not very efficient, but it does not consume any extra data structure. it's just processing.
        Oscars.Omap.setStats('OZGUPD')
        var fids = Oscars.Util.featureIds(geojson)
        //console.log("to update", fids)
        var layers_to_delete = []
        var ls = this.getLayers()
        ls.forEach(function(layer, idx) {
            var fid = Oscars.Util.getLayerFeatureId(layer)
            if (fid && fids.indexOf(fid) > -1) {
                //console.log("to delete", fid)
                layers_to_delete.push(layer)
            }
        })
        this.addData(geojson)
        const _local_this = this
        layers_to_delete.forEach(function(layer, idx) {
            //console.log("deleting layer..", Oscars.Util.getLayerFeatureId(layer))
            _local_this.removeLayer(layer)
            //console.log("..deleted")
        })
    }

})

Oscars.zoneGroup = function(src, options) {
    return new Oscars.ZoneGroup(src, options)
}