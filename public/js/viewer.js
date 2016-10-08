var Viewer = function(map, baseURL) {
    this.map = map;
    this.layerControl = new L.control.layers({}, {}).addTo(map);
    this.layers = [];
    this.baseURL = baseURL || "http://localhost:4000/database/sfrensley/layergroup";
    this.sidebar = new Sidebar(map, this.baseURL);
    this.initialize();
};

Viewer.prototype.initialize = function() {
     var scope = this;
   //   this.layerConfigs.map(function(config) {
   //        scope.getLayerConfigs(config);
   //   });

      $.ajax({
         url: this.baseURL + '/list',
         success: function(data, status, jqXHR) {
             _.each(data,function(config, index) {
               scope.configureLayer(config.map_config);
               scope.sidebar.addLayerConfigEditor(index,config.map_config);
             });
         },
         error: function(error) {
             console.info("error getLayerConfig: ",error);
         }
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

Viewer.prototype.setUtfGrid = function(baseURL, layers) {
      var scope = this;
      console.log("usf layers", layers);
      layers.forEach(function(layer, layerIndex) {
         var utfGridLayer = L.utfGrid(baseURL + '/' + layerIndex + '/{z}/{x}/{y}.grid.json', {
             resolution: 4,
             pointerCursor: true,
              mouseInterval: 66  // Delay for mousemove events
      });
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
         scope.layers.push(utfGridLayer);
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
     scope.setUtfGrid(tileBaseURL, metadataLayers);
     scope.layerControl.addOverlay(tileLayer, name);
};
