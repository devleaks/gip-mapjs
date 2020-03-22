/*
 * LeafletJS Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict";

L.Oscars = L.Oscars || {};

L.Oscars.ZoneGroup = L.Realtime.extend({

	options: {
		
		start: false,	// no auto-update of GeoJSON.
		
		getFeatureId: function(feature) {
      return L.Oscars.Util.getFeatureId(feature, "L.Oscars.ZoneGroup::getFeatureId: Warning - Feature has no name")
		},
		
		style: function(feature) {
			L.Oscars.Util.setStats('OZGSTY');
			if(feature && feature.properties && feature.properties._style) {
				return feature.properties._style;
			} else {
				console.log("L.Oscars.ZoneGroup::style: Warning - Feature has no style, using default", feature);
			}
			return L.Oscars.Util.getDefaults().STYLE;
		},
		
		onEachFeature: function(feature, layer) {
			L.Oscars.Util.setStats('OZGOEF');
			L.Oscars.Util.bindTexts(feature, layer);
		}

	},
	
	/**
	 *	Merge defaults with user-supplied defaults and install initial collection
	 */
	initialize: function(featureCollection, options) {
		L.Oscars.Util.setStats('OZGINI');
		L.setOptions(this, options);
		if(options && typeof options.gipDefaults != "undefined") {L.Oscars.Util.setDefaults(options.gipDefaults);}
        L.Realtime.prototype.initialize.call(this, {}, this.options);
		this.update(featureCollection);
		L.Oscars.Util.addLayerToControlLayer(featureCollection, this);
    }

});

L.Oscars.zoneGroup = function(src, options) {
    return new L.Oscars.ZoneGroup(src, options);
};