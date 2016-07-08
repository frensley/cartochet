var util = require('util');
var MapStoreMapConfigProvider = require('windshaft/lib/windshaft/models/providers/mapstore_mapconfig_provider');

function IdProvidedMapConfigProvider(mapConfig, params) {
    MapStoreMapConfigProvider.call(this, undefined, params);
    mapConfig.id = function () {
        return mapConfig._cfg._id;
    };
    this.mapConfig = mapConfig;
}

util.inherits(IdProvidedMapConfigProvider, MapStoreMapConfigProvider);

module.exports = IdProvidedMapConfigProvider;

IdProvidedMapConfigProvider.prototype.getMapConfig = function(callback) {
    return callback(null, this.mapConfig, this.params, {});
};
