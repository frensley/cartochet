var Sidebar = function(map, baseURL) {
    this.bar = L.control.sidebar('sidebar').addTo(map);
    this.baseURL = baseURL;
    this.tabs = {};
    // $(window).resize(function(e) {
    //    console.log("resized",e);
    //    // $('.sidebar-pane .active').fitToParent();
    //    // $('.sidebar-pane.active > .sidebar-container').fitToParent();
    //    // $('.sidebar-pane.active > .sidebar-container > form').fitToParent();
    //    //fit the active sidebar pane to the new sidebar content size
    //    // $('.sidebar-pane .active').fitToParent({
    //    //    height_offset: 600,
    //    //    callback: function(newWidth, newHeight) {
    //    //       console.log('height',newHeight);
    //    //       $('.sidebar-pane.active > .sidebar-container > form')[0].css("height",newHeight);
    //    //    }
    //    // });
    // });
};

Sidebar.prototype.addLayerConfigEditor = function(index, map_config) {
   var self = this,
       layer_idx = index,
       map_config = map_config;

   //form container
   var _template_tmpl = _.template('\
      <form id="<%= config_id %>" class="editor-form">\
         <div id="tabs<%= layer_idx %>" class="tab-container">\
            <input name="layer_name" type="text" value="<%= layer_name %>" class="editor-field" required>\
            <ul></ul>\
         </div>\
         <input value="Save" type="button" id="<%= config_id %>_save">\
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
      <div id="tabs<%= layer_idx %><%= index %>" class="tab-content">\
         <textarea class="sql-editor" id="sql<%= index %>" name="sql<%= index %>"><%= sql %></textarea>\
         <textarea class="style-editor" id="style<%= index %>" name="style<%= index %>"><%= css %></textarea>\
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

   //click handler for form save
   $(content).find("input[id=" + context.config_id + "_save]").on('click', function(e) {
      var self = this;
      self.savePanel(context.config_id);
      console.log('click ', context.config_id);
   }.bind(this));
   //for each layer in the layergroup generate a tab for each configuration
   _.each(map_config.layers, function(layer, index) {
      var context = {
         index: index,
         layer_idx: layer_idx,
         sql: layer.options.sql,
         css: layer.options.cartocss
      }
      //add tab header
      $(content).find('ul').append(_tab_header_tmpl(context));
      //add tab content
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

   $("textarea.sql-editor").each(function(idx, el) {
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
            self.refreshCodeMirror($(ui.newPanel).find('textarea'));
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

Sidebar.prototype.savePanel = function(config_id) {
    var self = this;
    //select form we are saving
    var form = $('form[id='+config_id+']');
    //transfer codemirror data to text areas
    self.saveCodeMirror(form.find('textarea'));
    //determine how man tabs there are
    var tabsize = form.find('li.ui-tabs-tab').length
    //serialize form data into object
    var formdata = transForm.serialize(config_id)
    //transform data to domething managable
    var data = [];
    for (var i=0; i < tabsize; i++) {
        data.push({
            sql: formdata['sql' + i],
            style: formdata['style' + i]
        })
    }
    console.log('json data: ', JSON.stringify(data));
    $.ajax({
        url: this.baseURL + '/save/' + config_id,
        type: 'POST',
        contentType: 'application/json',
        success: function(data, status, jqXHR) {
            console.log('save success');
        },
        error: function(error) {
            console.info("save error: ",error);
        },
        data: JSON.stringify(data)
    });

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
         <div class="sidebar-container"></div>\
      </div>\
   ');


   //turn template into elements
   var pane = $.parseHTML(_pane({name: name}));

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
