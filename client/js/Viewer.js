import 'sidebar-v2/css/leaflet-sidebar.css';
import 'sidebar-v2/js/leaflet-sidebar';
import 'leaflet-utfgrid/L.UTFGrid';

import Sidebar from 'Sidebar';

class Viewer {

    constructor(map, baseURL) {
        this.map = map;
        this.map.layerControl = new L.control.layers({}, {}).addTo(map);
        this.baseURL = baseURL || "http://localhost:4000/database/sfrensley/layergroup";
        this.sidebar = new Sidebar(map, this.baseURL);
        this._t = L.Util.template;
        this.initialize();
    }

    initialize() {
        var scope = this;

        $.ajax({
            url: this.baseURL + '/list',
            success: function(data, status, jqXHR) {
                $.each(data,function(index, config) {
                    //skip creating new layers for now
                    //scope.configureLayer(config.map_config);
                    //set map laters directly from list
                    scope.setMapLayer(config.map_id, config.map_config);
                    scope.sidebar.addLayerConfigEditor(index, config.map_id, config.map_config);
                });
            },
            error: function(error) {
                console.info("error getLayerConfig: ",error);
            }
        });
    }

    setUtfGrid(baseURL, layers, layerGroupId) {
        var scope = this;
        layers.forEach(function(layer, layerIndex) {
            if (layer.options && layer.options.interactivity) {
                var utfGridLayer = L.utfGrid(baseURL + '/' + layerIndex + '/{z}/{x}/{y}.grid.json', {
                    resolution: 4,
                    pointerCursor: true,
                    mouseInterval: 66  // Delay for mousemove events
                });
                utfGridLayer._layerGroupId = layerGroupId;
                utfGridLayer._layerGroupLayerId = layer.id;
                utfGridLayer._layerGroupName = name;
                utfGridLayer._layerGroupType = "utfGrid"
                var popup = new L.popup();
                utfGridLayer.on('click', function (e) {
                    if (e.data) {
                        popup.setLatLng(e.latlng)
                            .setContent(JSON.stringify(e.data))
                            .openOn(scope.map);
                        console.log('click', e.data);
                    } else {
                        console.log('click nothing');
                    }
                });
                scope.map.addLayer(utfGridLayer);
            }
        });
    }

    /**
     * This sets a layer on the map. It's actually a windshaft layergroup, consisting of multiple layers
     * @param mapId
     * @param metadata
     */
    setMapLayer(mapId, metadata) {
        var scope = this;
        metadata = metadata || {};
        var metadataLayers = metadata.layers || [];
        var tileBaseURL = scope.baseURL + '/' + mapId;
        var now = Date.now();
        var tileLayer = new L.tileLayer(tileBaseURL + '/{z}/{x}/{y}.png?cache_buster={cache}', {
            cache: function() {
                console.log("cacheId: ", tileLayer._cacheId);
                return tileLayer._cacheId;
            }
        });
        tileLayer._cacheId = now;
        tileLayer._layerGroupId = mapId;
        tileLayer._layerGroupType = "tileLayer";
        scope.map.addLayer(tileLayer);
        scope.setUtfGrid(tileBaseURL, metadataLayers, mapId);
        this.map.layerControl.addOverlay(tileLayer, metadata.name);
    }
}

export default Viewer;