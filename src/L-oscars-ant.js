/*
 * jQuery Oscars GIP Map Widget Helper
 * 2017 Pierre M
 * License: MIT
 */
"use strict";

var Oscars = Oscars || {};

Oscars.Rabbit = (function() {
    /**
     *  DEFAULT VALUES
     */
    // Defaults as used if no default is provided
    const VERSION = "1.0.0"
    const RABBIT = {
        "delay": 500,
        "dashArray": [
            30,
            100
        ],
        "weight": 1,
        "color": "#fffff",
        "pulseColor": "#00ff00",
        "paused": false,
        "reverse": false,
        "hardwareAccelerated": true
    }
    // internal vars
    var _inited = false
    var _layer = false
    var _rabbits = {}
    var _rabbitStyle


    function init(options) {
        _rabbitStyle = option.hasOwnProperty('rabbit') ? option.rabbit : RABBIT

        if(option.hasOwnProperty('layer')) {
            _layer = options.layer
            _inited = true
        } else {
            console.log("rabbit needs a layer")
        }
    }


    return {
        lighton: function(name, p_from, p_to) {
            var coords = []
            coords.push(p_from.geometry.coordinates)

            var c_from = findClosest(p_from, network)
            coords.push(c_from.geometry.coordinates)
            var c_to = findClosest(p_to, network)
            var path = pathfinder.findPath(c_from, c_to)

            if (path) {
                path.path.forEach(function(p) {
                    coords.push(p)
                })
                coords.push(c_to.geometry.coordinates)
                coords.push(p_to.geometry.coordinates)
            } else {
                console.log('Cannot find path');
            }


            coords = [
                [5.429949760437012, 50.63114388301683],
                [5.429954058512539, 50.63114134949315],
                [5.4300850801914065, 50.631230783397214],
                [5.429564, 50.6308751],
                [5.429318527068739, 50.631318244774675],
                [5.429232925101118, 50.63147277938857],
                [5.4290592, 50.6317864],
                [5.428817709421531, 50.63231467747907],
                [5.429129626316126, 50.632751316258556],
                [5.429284237579302, 50.632967749784335],
                [5.429492569545375, 50.633259384565804],
                [5.429753883859989, 50.63362518701309],
                [5.429857187508972, 50.63376979726021],
                [5.429691777776567, 50.63439672769832],
                [5.429169516235367, 50.63428802698654],
                [5.428909278126775, 50.63423386242452],
                [5.428735282689058, 50.63419764794876],
                [5.428735282689058, 50.63419764794876],
                [5.428615580164676, 50.63417273370833],
                [5.4281532415751315, 50.63506637478467]
            ]
            var latlngs = []
            coords.forEach(function(p) {
                latlngs.push([p[1], p[0]])
            })
            _rabbits[name] = L.polyline.antPath(latlngs, _rabbitStyle).addTo(_layer)
        },

        lightoff: function(name) {
            if (_rabbits.hasOwnProperty(name)) {
                _layer.removeLayer(_rabbits[name])
                delete _rabbits[name]
            }
        },

        alloff: function() {
            for (var name in _rabbits) {
                if (_rabbits.hasOwnProperty(name)) {
                    _layer.removeLayer(_rabbits[name])
                    delete _rabbits[name]
                }
            }
        }
    }


})();