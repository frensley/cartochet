import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'x-editable/dist/bootstrap3-editable/css/bootstrap-editable.css';
import 'bootstrap';
import 'x-editable/dist/bootstrap3-editable/js/bootstrap-editable';
import 'Leaflet.zoomdisplay/dist/leaflet.zoomdisplay.css';
import 'Leaflet.zoomdisplay/dist/leaflet.zoomdisplay';

import 'codemirror/lib/codemirror.css';
import codemirror from 'codemirror/lib/codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/json-lint';
import 'codemirror/mode/sql/sql';
import 'codemirror/cartocss';

import Viewer from 'Viewer';

const baseURL = "http://localhost:4000/database/sfrensley/layergroup";

$(document).ready(function() {
    //new map
    var map = new L.Map('map', {
        maxZoom: 18
    });
    //map has a _layers property - should we use it?
    map.layers = {};
    //starting position of map
    map.setView(new L.LatLng(29.9891, -97.8772), 11, true);
    map.on('layeradd', (e) => {
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
    map.on('layerremove', (e, layer) => {
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