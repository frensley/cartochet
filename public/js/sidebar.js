var Sidebar = function(map) {
   this.bar = L.control.sidebar('sidebar').addTo(map);
   this.tabs = {};
};

Sidebar.prototype.addLayerConfigEditor = function(index, map_config) {
   var self = this,
       layer_idx = index,
       map_config = map_config;

   //form container
   var _template_tmpl = _.template('\
      <form id="<%= config_id %>" class="editor-form">\
         <input name="layer_name" type="text" value="<%= layer_name %>" required>\
         <div id="tabs<%= layer_idx %>" class="tab-container">\
            <ul></ul>\
         </div>\
         <input value="Save" type="button">\
      </form>\
   ');

   //layergroup config tab header
   var _tab_header_tmpl = _.template('\
      <li>\
         <a href="#tabs<%= layer_idx %><%= index %>"><%= index %></a>\
      </li>\
   ');

   //layergroup config tab content
   var _tab_content_tmpl = _.template('\
      <div id="tabs<%= layer_idx %><%= index %>">\
         <textarea class="sql-editor" id="sql" name="sql"><%= sql %></textarea>\
         <textarea class="style-editor" id="style" name="style"><%= css %></textarea>\
      </div>\
   ');



   //generate a partial DOM from the templates to be appended to the sidebar
   var context = {
      config_id : map_config.config_id,
      layer_name : map_config.name,
      layer_idx: layer_idx
   };

   //generate the form container for the sidebar tab
   var content = $.parseHTML(_template_tmpl(context));

   //for each layer in the layergroup generate a tab for each configuration
   _.each(map_config.layers, function(layer, index) {
      var context = {
         index: index,
         layer_idx: layer_idx,
         sql: layer.options.sql,
         css: layer.options.cartocss
      }
      $(content).find('ul').append(_tab_header_tmpl(context));
      $(content).find('.tab-container').append(_tab_content_tmpl(context));
      console.log("layer:", JSON.stringify(layer, null, 2));
   });

   //dynamically update the sidebar widget with the new content
   self.addTab(map_config.config_id, "fa-map", content);

   //make style editors into CodeMirror widgets if they aren't already one.
   $("textarea.style-editor").each(function(idx, el) {
      if (!self.getCodeMirror(el)) {
         CodeMirror.fromTextArea(el, {
            lineNumbers: true
         });
      }
   });

   //since CodeMirror can't figure out it's layout until the dom is visible, we refresh when the tab activates
   //this does not apply to the first tab. We must use the sidebar 'content' event to refresh the first visiable tab
   $(".tab-container").each(function(idx,el) {
      $(el).tabs({
         activate: function(event, ui) {
            self.refreshCodeMirror($(ui.newPanel).find('textarea.style-editor'));
         }
      });
   });

   //since CodeMirror can't figure out it's layout until the dom is visible, we refresh when the sidebar
   //widget shows the pane for the _first_ visible tab. Other need to be refreshed on activate.
   self.bar.on('content', function(event) {
      var self = this,
          id = event.id;
      //find all the code mirror textareas and refresh them
      $('#'+id+' textarea').each(function (index, el) {
         self.refreshCodeMirror(el);
      });
   }, this);

}

Sidebar.prototype.refreshCodeMirrorsInTab = function(target) {
   console.log('refresh tab', target);
}

//Refresh the CodeMirror object if it exists at the target
Sidebar.prototype.refreshCodeMirror = function(target) {
   var self = this;
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
   var _control = _.template('\
      <li>\
         <a role="tab" href="#<%= name %>">\
            <i class="fa <%= icon %>"></i>\
         </a>"\
      </li>\
   ');
   //apend control to DOM
   $(tablists[0]).append(_control({name:name, icon: icon}));

   //create content pane
   var _pane = _.template('\
      <div class="sidebar-pane" id="<%= name %>">\
         <h1 class="sidebar-header">\
            <%= name %>\
            <span class="sidebar-close">\
               <i class="fa fa-caret-left"></i>\
            </span>\
         </h1>\
         <div id="sidebar-container"></div>\
      </div>\
   ');


   //turn template into elements
   var pane = $.parseHTML(_pane({name: name}));

   //reference content before adding to DOM
   var tab_content = $(pane).find('#sidebar-container');
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

//deprecated
Sidebar.prototype.createElement = function(tagName, attributes, container) {
   var start = new Date().getTime();
   var el = document.createElement(tagName);
   for (var attr in attributes) {
      el.setAttribute(attr, attributes[attr]);
   }

	if (container) {
		container.appendChild(el);
	}
   var end = new Date().getTime();
   var time = end - start;
   console.log('Element creation took ' + time);
	return el;
};
