var Sidebar = function(map, baseURL) {
    this.map = map;
    this.bar = L.control.sidebar('sidebar').addTo(map);
    this.baseURL = baseURL;
    this.tabs = {};
    this._t = L.Util.template;
};


Sidebar.prototype.addLayerConfigEditor = function(index, map_id, map_config) {
   var self = this,
       layer_idx = index;

   //form container
   var _template_tmpl = '\
          <form id="{map_id}" class="editor-form">\
             <input name="layer_name" type="text" value="{layer_name}" class="form-control editor-field" required>\
             <ul id="tabs{layer_idx}" class="nav nav-tabs" role="tablist"></ul>\
             <div id= "tabs-content{layer_idx}" class="tab-content"></div>\
             <input value="Save" type="button" id="{map_id}_save" class="btn btn-primary">\
          </form>\
   ';

   //layergroup config tab header
   var _tab_header_tmpl = '\
      <li>\
         <a id="navtab-{layer_idx}" href="#tabs{layer_idx}{index}" role="tab" data-toggle="tab">{index}</a>\
      </li>\
   ';

   //layergroup config tab content
   var _tab_content_tmpl = '\
      <div id="tabs{layer_idx}{index}" class="tab-pane">\
         <div class="form-group">\
            <label for="sql{index}" class="field-label">SQL</label>\
            <textarea class="editor sql-editor" id="{index}" name="sql{index}">{sql}</textarea>\
         </div>\
         <div class="form-group">\
            <label for="style{index}" class="field-label">Style</label>\
            <textarea class="editor style-editor" id="style{index}" name="style{index}">{css}</textarea>\
         </div>\
      </div>\
   ';



   //generate a partial DOM from the templates to be appended to the sidebar
   var context = {
      map_id : map_id,
      layer_name : map_config.name,
      layer_idx: layer_idx
   };

   //generate the form container for the sidebar tab
   var content = $.parseHTML(self._t(_template_tmpl, context));

   //click handler for form save
   $(content).find("input[id=" + context.map_id + "_save]").on('click', function(e) {
      var self = this;
      self.savePanel(context.map_id);
      console.log('click ', context.map_id);
   }.bind(this));
   //for each layer in the layergroup generate a tab for each configuration
   $.each(map_config.layers, function(index, layer) {
      var context = {
         index: index,
         layer_idx: layer_idx,
         sql: layer.options.sql,
         css: layer.options.cartocss
      }
      //add tab header
      $(content).find('ul').append(self._t(_tab_header_tmpl,context));
      //add tab content
      $(content).find('.tab-content').append(self._t(_tab_content_tmpl,context));
      console.log("layer:", JSON.stringify(layer, null, 2));
   });

   //dynamically update the sidebar widget with the new content
   self.addTab(map_id, "fa-map", content);

   //make style editors into CodeMirror widgets if they aren't already one.
   $("textarea.style-editor").each(function(idx, el) {
      if (!self.getCodeMirror(el)) {
         CodeMirror.fromTextArea(el, {
            lineNumbers: true,
            matchBrackets: true,
            gutters: ["CodeMirror-lint-markers"],
            mode: 'cartocss'
         });
      }
   });

   $("textarea.sql-editor").each(function(idx, el) {
      if (!self.getCodeMirror(el)) {
         CodeMirror.fromTextArea(el, {
            lineNumbers: true,
            mode: 'text/x-pgsql'
         });
      }
   });

    //activate first tab
   $('#tabs' + layer_idx + ' a:first').tab('show');


    //since CodeMirror can't figure out it's layout until the dom is visible, we refresh when the tab activates
    //this does not apply to the first tab. We must use the sidebar 'content' event to refresh the first visiable tab
   $('a[data-toggle=tab]').off('shown.bs.tab');
   $('a[data-toggle=tab]').on('shown.bs.tab', $.proxy(function(e) {
       self = this;
       var id = e.target.id;
       //navtab-18
       if (id && id.length > 6) {
           var number = id.substring(7);
           $('#tabs-content'+number+ ' .editor').each(function (index, el) {
               console.log('tabs-content ' + number);
               self.refreshCodeMirror(el);
           });
       }
   }, this));


   //since CodeMirror can't figure out it's layout until the dom is visible, we refresh when the sidebar
   //widget shows the pane for the _first_ visible tab. Other need to be refreshed on activate.
   self.bar.off('content');
   self.bar.on('content', function(event) {
      var self = this,
          id = event.id;
      //find all the code mirror textareas and refresh them
      $('#'+id+' textarea').each(function (index, el) {
         self.refreshCodeMirror(el);
      });
   }, this);

}

Sidebar.prototype.savePanel = function(map_id) {
    var self = this;
    //select form we are saving
    var form = $('form[id='+map_id+']');
    //transfer codemirror data to text areas
    self.saveCodeMirror(form.find('textarea'));
    //determine how man tabs there are
    var tabsize = form.find('li.ui-tabs-tab').length
    //serialize form data into object
    var formdata = transForm.serialize(form[0])
    console.log("form data is : ", JSON.stringify(formdata));
    //transform data to domething managable
    var data = {
        layer_name: formdata.layer_name,
        options: []
    };
    for (var i=0; i < tabsize; i++) {
        data.options.push({
            sql: formdata['sql' + i],
            style: formdata['style' + i]
        })
    }
    console.log('json data: ', JSON.stringify(data));
    $.ajax({
        url: self._t("{base}/save/{id}",{base: this.baseURL, id: map_id}),
        type: 'POST',
        contentType: 'application/json',
        success: function(data, status, jqXHR) {
            console.log('save success');
            self.refreshLayers(map_id);
        },
        error: function(error) {
            console.info("save error: ",error);
        },
        data: JSON.stringify(data)
    });

Sidebar.prototype.refreshLayers = function(map_id) {
    var self = this;
    var layers = self.map.layers[map_id];

    if (layers) {
        console.log("refresh id", map_id);
        layers.tileLayer._cacheId = Date.now();
        layers.tileLayer.redraw();
    }
}

}

//takes the code mirror element and copies the content of the editor to the textarea
Sidebar.prototype.saveCodeMirror = function(target) {
   var self = this;
   var $target = target instanceof jQuery ? target : $(target);
   if ($target.length > 0) {
      $target.each(function (idx, el) {
          var cm = self.getCodeMirror(el);
          if (cm) {
              //update text area with contents of editor
              cm.save();
          }
      });
   }
   var cm = self.getCodeMirror(target);
   if (cm) {
      cm.save();
   }
}

//Refresh the CodeMirror object if it exists at the target
Sidebar.prototype.refreshCodeMirror = function(target) {
   var self = this;
   var $target = target instanceof jQuery ? target : $(target);
   if ($target.length > 0) {
      $target.each(function(idx, el) {
         var cm = self.getCodeMirror(el);
         if (cm) {
            cm.refresh();
         }
      });
   }
   var cm = self.getCodeMirror(target);
   if (cm) {
      cm.refresh();
   }
}

//Retreive a CodeMirror instance from the DOM if it exists at the target
Sidebar.prototype.getCodeMirror = function(target) {
   var $target = target instanceof jQuery ? target : $(target);
   if ($target.length === 0) {
      return false;
   }

   if (!$target.hasClass('CodeMirror')) {
 	    if ($target.is('textarea')) {
          $target = $target.next('.CodeMirror');
       }
   }
   if (typeof $target.get == 'function') {
      if ($target.get(0))
         return $target.get(0).CodeMirror;
   }
   return false;
}

//Add tab to sidebar with included content
Sidebar.prototype.addTab = function(name, icon, content) {
   var self = this,
       name = name,
       icon = icon || "fa fa-folder",
       sidebar_content   = self.bar.getContainer(),
       tablists    = $('div.sidebar-tabs').find('ul');

   //create control for tab
   var _control = '\
      <li>\
         <a role="tab" href="#{name}">\
            <i class="fa {icon}"></i>\
         </a>"\
      </li>\
   ';
   //apend control to DOM
   $(tablists[0]).append(self._t(_control,{name:name, icon: icon}));

   //create content pane
   var _pane = '\
      <div class="sidebar-pane" id="{name}">\
         <h1 class="sidebar-header">\
            <input name="layer_name" type="text" value="{name}" class="editor-field" required>\
            <span class="sidebar-close">\
               <i class="fa fa-caret-left"></i>\
            </span>\
         </h1>\
         <div class="container-fluid sidebar-container"></div>\
      </div>\
   ';


   //turn template into elements
   var pane = $.parseHTML(self._t(_pane,{name: name}));

   //reference content before adding to DOM
   var tab_content = $(pane).find('.sidebar-container');
   self.tabs[name] = tab_content;

   //add to DOM
   $(sidebar_content).append(pane);

   //reinitialize the control. It does not support dynamic adds
   self.bar.removeFrom(map);
   self.bar = L.control.sidebar('sidebar').addTo(map);


   if (content) {
     self.addTabContent(name,content);
   }
};

Sidebar.prototype.addTabContent = function(name, content) {
   var self = this,
       tab_content = self.tabs[name];

   if (tab_content) {
      //remove all contents
      while(tab_content.firstChild){
         $.empty(div.firstChild);
      }

      $(tab_content).append(content);
   }
};