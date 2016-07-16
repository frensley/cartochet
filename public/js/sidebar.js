var Sidebar = function(map) {
   this.bar = L.control.sidebar('sidebar').addTo(map);
   this.tabs = {};
};

Sidebar.prototype.addTab = function(name, icon, content) {
   var self = this,
       name = name,
       icon = icon || "fa fa-folder"
       sidebar_content   = self.bar.getContainer(),
       sidebar_container = sidebar_content.parentNode;
       sidebar_tabs = sidebar_container.querySelector('div.sidebar-tabs'),
       tablists    = sidebar_tabs.querySelectorAll('ul');

      //create control
   var li   = self.createElement('li', null, tablists[0]),
       a    = self.createElement('a', {role: 'tab', href: '#' + name}, li);
       i    = self.createElement('i', {class: 'fa ' + icon}, a);

       //create content pane
   var sidebar_pane = self.createElement('div', {class: 'sidebar-pane', id: name}, sidebar_content);
   var header = self.createElement('h1', {class: 'sidebar-header'}, sidebar_pane);
   var tab_content = self.createElement('div',{id: 'sidebar-content'}, sidebar_pane);
   var span = self.createElement('span', {class: 'sidebar-close'}, header);
   self.createElement('i', {class: 'fa fa-caret-left'}, span);
   header.insertAdjacentHTML('afterbegin', name);

   //reinitialize the control. It does not support dynamic adds
   self.bar.removeFrom(map);
   self.bar = L.control.sidebar('sidebar').addTo(map);
   self.tabs[name] = tab_content;
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
         tab_content.removeChild(div.firstChild);
      }
      tab_content.insertAdjacentHTML('beforeend', content);
   }
};

Sidebar.prototype.createElement = function(tagName, attributes, container) {
   var el = document.createElement(tagName);
   for (var attr in attributes) {
      el.setAttribute(attr, attributes[attr]);
   }

	if (container) {
		container.appendChild(el);
	}
	return el;
};
