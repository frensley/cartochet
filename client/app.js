require('leaflet/dist/leaflet.css')
require('font-awesome/css/font-awesome.css')
require('bootstrap/dist/css/bootstrap.css')
require('x-editable/dist/bootstrap3-editable/css/bootstrap-editable.css')
require('bootstrap');
require('x-editable/dist/bootstrap3-editable/js/bootstrap-editable')
require('Leaflet.zoomdisplay/dist/leaflet.zoomdisplay.css')
require('Leaflet.zoomdisplay/dist/leaflet.zoomdisplay')

require('codemirror/lib/codemirror.css')
var codemirror = require('codemirror/lib/codemirror');
require('codemirror/mode/javascript/javascript');
require('codemirror/addon/edit/matchbrackets');
require('codemirror/addon/lint/lint.css');
require('codemirror/addon/lint/lint');
require('codemirror/addon/lint/json-lint')
require('codemirror/mode/sql/sql')
require('codemirror/cartocss')

var Viewer = require('viewer');

var baseURL = "http://localhost:4000/database/sfrensley/layergroup";

$(document).ready(function() {
    //new map
    var map = new L.Map('map', {
        maxZoom: 18
    });
    //map has a _layers property - should we use it?
    map.layers = {};
    //starting position of map
    map.setView(new L.LatLng(29.9891, -97.8772), 11, true);
    map.on('layeradd', function(e) {
        var layer = e.layer;
        var mapId = layer._layerGroupId;
        if (!map.layers.hasOwnProperty(mapId)) {
            map.layers[mapId] = {
                tileLayer: {},
                utfGrid: []
            }
        }
        if (layer._layerGroupType === 'tileLayer') {
            console.log('pushed tile layer: ', layer);
            map.layers[mapId].tileLayer = layer;
        }
        if (layer._layerGroupType === 'utfGrid') {
            console.log('pushed utfgrid layer: ', layer);
            map.layers[mapId].utfGrid.push(layer);
        }
    });
    map.on('layerremove', function(e, layer) {
        console.log('Implement me!! layer removed', e, layer);
    });

    var viewer = new Viewer(map, baseURL);

    var myCodeMirror = codemirror.fromTextArea($('#editor')[0], {
        lineNumbers: true,
        matchBrackets: true,
        gutters: ["CodeMirror-lint-markers"],
        lint: true,
        mode: "application/json"
    });
});