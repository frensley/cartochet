var Viewer = function(map, layers, baseURL) {
     this.map = map;
     this.layerControl = new L.control.layers({}, {}).addTo(map);
     this.layerConfigs = layers || ["layer1"];
     this.layers = [];
     this.baseURL = baseURL || "http://localhost:4000/database/sfrensley/layergroup";
     this.initialize();
};

Viewer.prototype.initialize = function() {
     var scope = this;
     this.layerConfigs.map(function(config) {
          scope.getLayerConfigs(config);
     });
};

Viewer.prototype.getLayerConfigs = function(name) {
     var scope = this;
     $.ajax({
         url: name + ".json",
         //cache: false,
         //ifModified: true,
         dataFilter: function(data, type) {
              if (data) {
                  //returns and new lines in the layer json files
                  return data.replace(/[\r\n]/gm,"");
              }
         },
         success: function(data, status, jqXHR) {
             console.info("success getLayerConfig: ",data);
             scope.configureLayer(data);
         },
         error: function(error) {
             console.info("error getLayerConfig: ",error);
         }
   });
};

Viewer.prototype.configureLayer = function(layerConfig) {
     var scope = this;
     var name = layerConfig.name || "unnamed";
     $.ajax({
       url: scope.baseURL,
       type: 'POST',
       contentType: 'application/json',
       error: function(xhr, textStatus, errorThrown) {
         console.error("Error: " + textStatus + " / " + JSON.stringify(errorThrown));
       },
       success: function(data, textStatus) {
         console.info("Success: " + textStatus + " / " + JSON.stringify(data));
         scope.setMapLayer(data.layergroupid, data.metadata, name);
       },
       data: JSON.stringify(layerConfig, null, 2)
     });
};

Viewer.prototype.setMapLayer = function(token, metadata, name) {
     var scope = this;
     metadata = metadata || {};
     var metadataLayers = metadata.layers || [];
     var tileBaseURL = scope.baseURL + '/' + token;
     var tileLayer = new L.tileLayer(tileBaseURL + '/{z}/{x}/{y}.png');
     scope.map.addLayer(tileLayer);
     scope.layers.push(tileLayer);
     scope.layerControl.addOverlay(tileLayer, name);
};
