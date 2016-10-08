var assert = require('assert');
var step = require('windshaft/node_modules/step');
var windshaft = require('../../node_modules/windshaft/lib/windshaft');

var MapConfig = windshaft.model.MapConfig;
var CartochetMapConfigProvider = require('../providers/cartochet_mapconfig_provider');

var MapStoreMapConfigProvider = windshaft.model.provider.MapStoreMapConfig;

/**
 * @param app
 * @param {MapStore} mapStore
 * @param {MapBackend} mapBackend
 * @param {TileBackend} tileBackend
 * @param {AttributesBackend} attributesBackend
 * @constructor
 */
function MapController(app, mapStore, mapBackend, tileBackend, attributesBackend) {
    this._app = app;
    this.mapStore = mapStore;
    this.mapBackend = mapBackend;
    this.tileBackend = tileBackend;
    this.attributesBackend = attributesBackend;
}

module.exports = MapController;


MapController.prototype.register = function(app) {
   console.log('maps', app.base_url_mapconfig);
    app.get(app.base_url_mapconfig + '/:token/:z/:x/:y@:scale_factor?x.:format', this.tile.bind(this));
    app.get(app.base_url_mapconfig + '/:token/:z/:x/:y.:format', this.tile.bind(this));
    app.get(app.base_url_mapconfig + '/:token/:layer/:z/:x/:y.(:format)', this.layer.bind(this));
    app.get(app.base_url_mapconfig + '/list', this.listLayers.bind(this));
    app.post(app.base_url_mapconfig + '/save/:cid', this.update.bind(this));
    app.get(app.base_url_mapconfig, this.createGet.bind(this));
    app.post(app.base_url_mapconfig, this.createPost.bind(this));
    app.get(app.base_url_mapconfig + '/:token/:layer/attributes/:fid', this.attributes.bind(this));
    app.options(app.base_url_mapconfig, this.cors.bind(this));
    app.options(app.base_url_mapconfig + '/save/:cid', this.cors.bind(this));
};

// send CORS headers when client send options.
MapController.prototype.cors = function(req, res, next) {
    this._app.doCORS(res, "Content-Type");
    return next();
};

// Gets attributes for a given layer feature
MapController.prototype.attributes = function(req, res) {
    var self = this;

    this._app.doCORS(res);

    step(
        function setupParams() {
            self._app.req2params(req, this);
        },
        function retrieveFeatureAttributes(err) {
            assert.ifError(err);
            var mapConfigProvider = new MapStoreMapConfigProvider(self.mapStore, req.params);
            self.attributesBackend.getFeatureAttributes(mapConfigProvider, req.params, false, this);
        },
        function finish(err, tile) {
            if (err) {
                // See https://github.com/Vizzuality/Windshaft-cartodb/issues/68
                var errMsg = err.message ? ( '' + err.message ) : ( '' + err );
                self._app.sendError(res, { errors: [errMsg] }, self._app.findStatusCode(err), 'ATTRIBUTES', err);
            } else {
                res.send(tile, 200);
            }
        }
    );

};

MapController.prototype.update = function(req, res) {
    var self = this;
    this._app.doCORS(res);
    var data = req.body;
    var configid = req.params.cid;
    console.log("MapController save: ", data);
    console.log("MapController save cid: " + configid);
    this.mapStore.updateOptions(configid, data, function(error, response) {
        if (error) {
            self._app.sendError(res, { errors: [ error.message ] }, self._app.findStatusCode(error), 'LAYERGROUP', error);
        } else {
            res.send(response, 200);
        }
    });
};

MapController.prototype.listLayers = function(req, res) {
    this._app.doCORS(res);
    this.mapStore.listLayers(function(err,results) {
      if (err) {
         res.json(err);
      }
      res.json(results.rows);
    });
};

MapController.prototype.create = function(req, res, prepareConfigFn) {
    var self = this;

    this._app.doCORS(res);
    step(
        function setupParams(){
            self._app.req2params(req, this);
        },
        prepareConfigFn,
        function initLayergroup(err, requestMapConfig) {
            assert.ifError(err);
            var mapConfig = MapConfig.create(requestMapConfig);
            self.mapBackend.createLayergroup(
                mapConfig, req.params, new CartochetMapConfigProvider(mapConfig, req.params), this
            );
        },
        function finish(err, response){
            if (err) {
                self._app.sendError(res, { errors: [ err.message ] }, self._app.findStatusCode(err), 'LAYERGROUP', err);
            } else {
                res.send(response, 200);
            }
        }
    );
};

MapController.prototype.createGet = function(req, res){
    this.create(req, res, function createGet$prepareConfig(err, req) {
        assert.ifError(err);
        if ( ! req.params.config ) {
            throw new Error('layergroup GET needs a "config" parameter');
        }
        return JSON.parse(req.params.config);
    });
};

// TODO rewrite this so it is possible to share code with `MapController::create` method
MapController.prototype.createPost = function(req, res) {
    this.create(req, res, function createPost$prepareConfig(err, req) {
        assert.ifError(err);
        if ( ! req.headers['content-type'] || req.headers['content-type'].split(';')[0] !== 'application/json' ) {
            throw new Error('layergroup POST data must be of type application/json');
        }
        return req.body;
    });
};

// Gets a tile for a given token and set of tile ZXY coords. (OSM style)
MapController.prototype.tile = function(req, res) {
    this.tileOrLayer(req, res);
};

// Gets a tile for a given token, layer set of tile ZXY coords. (OSM style)
MapController.prototype.layer = function(req, res, next) {
    if (req.params.token === 'static') {
        return next();
    }
    this.tileOrLayer(req, res);
};

MapController.prototype.tileOrLayer = function (req, res) {
    var self = this;

    this._app.doCORS(res);
    step(
        function mapController$prepareParams() {
            self._app.req2params(req, this);
        },
        function mapController$getTile(err) {
            if ( err ) {
                throw err;
            }
            self.tileBackend.getTile(new MapStoreMapConfigProvider(self.mapStore, req.params), req.params, this);
        },
        function mapController$finalize(err, tile, headers) {
            self.finalizeGetTileOrGrid(err, req, res, tile, headers);
            return null;
        },
        function finish(err) {
            if ( err ) {
                console.error("windshaft.tiles: " + err);
            }
        }
    );
};

// This function is meant for being called as the very last
// step by all endpoints serving tiles or grids
MapController.prototype.finalizeGetTileOrGrid = function(err, req, res, tile, headers) {
    if (err){
        // See https://github.com/Vizzuality/Windshaft-cartodb/issues/68
        var errMsg = err.message ? ( '' + err.message ) : ( '' + err );

        // Rewrite mapnik parsing errors to start with layer number
        var matches = errMsg.match("(.*) in style 'layer([0-9]+)'");
        if (matches) {
            errMsg = 'style'+matches[2]+': ' + matches[1];
        }

        this._app.sendError(res, { errors: ['' + errMsg] }, this._app.findStatusCode(err), 'TILE', err);
    } else {
        res.send(tile, headers, 200);
    }
};
