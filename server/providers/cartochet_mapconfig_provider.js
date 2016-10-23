var util = require('util');
var MapStoreMapConfigProvider = require('windshaft/lib/windshaft/models/providers/mapstore_mapconfig_provider');

function CartochetMapConfigProvider(mapConfig, params) {
    MapStoreMapConfigProvider.call(this, undefined, params);
    this.mapConfig = mapConfig;
}

util.inherits(CartochetMapConfigProvider, MapStoreMapConfigProvider);

module.exports = CartochetMapConfigProvider;

CartochetMapConfigProvider.prototype.getMapConfig = function(callback) {
    return callback(null, this.mapConfig, this.params, {});
};
