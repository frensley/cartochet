var assert = require('assert');
var step = require('windshaft/node_modules/step');
var pg = require('pg');
var windshaft = require('../../node_modules/windshaft/lib/windshaft');

function ConfigController(app, mapStore) {
   this._app = app;
   this.mapStore = mapStore;
   this.base_url = app.base_url_config;
}

module.exports = ConfigController;

ConfigController.prototype.register = function(app) {
   console.log('base_url', this.base_url);
   app.options(app.base_url, this.cors.bind(this));
   app.get(this.base_url + '/list', this.listLayers.bind(this));
}

// send CORS headers when client send options.
ConfigController.prototype.cors = function(req, res, next) {
    this._app.doCORS(res, "Content-Type");
    return next();
};

ConfigController.prototype.listLayers = function(req, res, opts) {
    this._app.doCORS(res);
    this.mapStore.listLayers(function(err,results) {
      if (err) {
         res.json(err);
      }
      res.json(results.rows);
    });
};
