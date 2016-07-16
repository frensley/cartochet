var Viewer = function(map, baseURL) {
     this.map = map;
     this.sidebar = new Sidebar(map);
     this.layerControl = new L.control.layers({}, {}).addTo(map);
     this.layers = [];
     this.baseURL = baseURL || "http://localhost:4000/database/sfrensley/layergroup";
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
             console.info("success getLayerConfig: ",data);
             _.each(data,function(config, index) {
               console.log(config);
               scope.configureLayer(config.map_config);
               var config_data = JSON.stringify(config, null, 2);
               var context = {
                  config_id : config.map_config.config_id,
                  layer_name : config.map_config.name,
                  config_data: config_data
               };
               var _template_tmpl = _.template(
                  '<form id="<%= config_id %>" class="viewer-editor-form tab_container">' +
                  '<div class="viewer-editor-field">' +
                  '<input name="layer_name" type="text" value="<%= layer_name %>" required>' +
                  '<label for="layer_name">Layer Name</label>' +
                  '</div>' +
                  '<ul class="tabs">'
               );
               var _tab_content_tmpl = _.template(
                  '<li>' +
                     '<input id="tab<%= layer_idx %><%= index %>" type="radio" name="tabs" <%= checked %>>' +
                     '<label for="tab<%= layer_idx %><%= index %>"><i class="fa fa-folder"></i><span>Layer <%= index %></span></label>' +
                     '<div id="tab-content<%= layer_idx %><%= index %>" class="tab-content animated fadeIn">' +
                        '<div class="viewer-editor-field viewer-sql-editor">' +
                           '<textarea class="viewer-sql-editor" id="sql" name="sql"><%= sql %></textarea>' +
                           '<label for="sql" >SQL</label>' +
                        '</div>' +
                        '<div class="viewer-editor-field viewer-style-editor">' +
                           '<textarea class="viewer-style-editor" id="style" name="style"><%= css %></textarea>' +
                           '<label for="style" >Style</label>' +
                        '</div>' +
                     '</div>' +
                  '</li>'
               );
               var tab_content = content = '';
               var layer_idx = index;
               _.each(config.map_config.layers, function(layer, index) {
                  var context = {
                     checked: index == 0 ? 'checked' : '',
                     index: index,
                     layer_idx: layer_idx,
                     sql: layer.options.sql,
                     css: layer.options.cartocss
                  }
                  tab_content += _tab_content_tmpl(context);
                  console.log("layer:", JSON.stringify(layer, null, 2));
               });
               content += _template_tmpl(context);
               content += tab_content;
               content += '</ul><input value="Save" type="button"></form>';
               scope.sidebar.addTab(config.map_config.config_id, "fa-map", content);
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
         var utfGridLayer = new L.UtfGrid(baseURL + '/' + layerIndex + '/{z}/{x}/{y}.grid.json?callback={cb}');
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
