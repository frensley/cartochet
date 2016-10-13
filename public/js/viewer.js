var Viewer = function(map, baseURL) {
    this.map = map;
    this.map.layerControl = new L.control.layers({}, {}).addTo(map);
    this.baseURL = baseURL || "http://localhost:4000/database/sfrensley/layergroup";
    this.sidebar = new Sidebar(map, this.baseURL);
    this._t = L.Util.template;
    this.initialize();
};

Viewer.prototype.initialize = function() {
     var scope = this;

      $.ajax({
         url: this.baseURL + '/list',
         success: function(data, status, jqXHR) {
             _.each(data,function(config, index) {
                //skip creating new layers for now
                //scope.configureLayer(config.map_config);
                //set map laters directly from list
                scope.setMapLayer(config.map_id, config.map_config, config.map_config.name, config.map_config.config_id);
                scope.sidebar.addLayerConfigEditor(index,config.map_config);
             });
         },
         error: function(error) {
             console.info("error getLayerConfig: ",error);
         }
      });
};

// Viewer.prototype.getLayerConfigs = function(name) {
//      var scope = this;
//      $.ajax({
//          url: name + ".json",
//          //cache: false,
//          //ifModified: true,
//          dataFilter: function(data, type) {
//               if (data) {
//                   //returns and new lines in the layer json files
//                   return data.replace(/[\r\n]/gm,"");
//               }
//          },
//          success: function(data, status, jqXHR) {
//              console.info("success getLayerConfig: ",data);
//              scope.configureLayer(data);
//          },
//          error: function(error) {
//              console.info("error getLayerConfig: ",error);
//          }
//    });
// };
//
// Viewer.prototype.configureLayer = function(layerConfig) {
//     var scope = this;
//     var config_id = layerConfig.config_id || "unknown";
//     var name = layerConfig.name || "unknown"
//     console.log("layerCobfig: ", layerConfig);
//      $.ajax({
//        url: scope.baseURL,
//        type: 'POST',
//        contentType: 'application/json',
//        error: function(xhr, textStatus, errorThrown) {
//          console.error("Error: " + textStatus + " / " + JSON.stringify(errorThrown));
//        },
//        success: function(data, textStatus) {
//          console.info("Success: " + textStatus + " / " + JSON.stringify(data));
//          scope.setMapLayer(data.layergroupid, data.metadata, name, config_id);
//        },
//        data: JSON.stringify(layerConfig, null, 2)
//      });
// };

Viewer.prototype.setUtfGrid = function(baseURL, layers, configId, layerGroupId) {
    var scope = this;
    layers.forEach(function(layer, layerIndex) {
        if (layer.options && layer.options.interactivity) {
            var utfGridLayer = L.utfGrid(baseURL + '/' + layerIndex + '/{z}/{x}/{y}.grid.json', {
                resolution: 4,
                pointerCursor: true,
                mouseInterval: 66  // Delay for mousemove events
            });
            utfGridLayer._layerGroupId = layerGroupId;
            utfGridLayer._layerGroupConfigId = configId;
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
};


/**
 * This sets a layer on the map. It's actually a windshaft layergroup, consisting of multiple layers
 * @param token
 * @param metadata
 * @param name
 */
Viewer.prototype.setMapLayer = function(token, metadata, name, configId) {
    var scope = this;
    metadata = metadata || {};
    var metadataLayers = metadata.layers || [];
    var tileBaseURL = scope.baseURL + '/' + token;
    var now = Date.now();
    var tileLayer = new L.tileLayer(tileBaseURL + '/{z}/{x}/{y}.png?cache_buster={cache}', {
        cache: function() {
            console.log("cacheId: ", tileLayer._cacheId);
            return tileLayer._cacheId;
        }
    });
    tileLayer._cacheId = now;
    tileLayer._layerGroupId = token;
    tileLayer._layerGroupConfigId = configId;
    tileLayer._layerGroupType = "tileLayer";
    scope.map.addLayer(tileLayer);
    scope.setUtfGrid(tileBaseURL, metadataLayers, configId, token);
    this.map.layerControl.addOverlay(tileLayer, name);
};
