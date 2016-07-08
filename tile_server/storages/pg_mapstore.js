// Map configuration storage

//var step       = require('step');
var _          = require('windshaft/node_modules/underscore');
var MapConfig  = require('windshaft/lib/windshaft/models/mapconfig');
var assert = require('assert');
var pg = require('pg');

/**
 * @constructor
 * @type {MapStore}
 */
function MapStore(opts) {
  opts = opts || {};
  this._config = _.defaults(opts, {
    pg_host: "127.0.0.1",
    pg_port: 5432,
    pg_user: '',
    pg_password: '',
    pg_db: "postgres",
    pg_key_mapcfg_prefix: "map_cfg|",
    expire_time: 300, // in seconds (7200 is 5 hours; 300 is 5 minutes)
    pool_max: 20,
    pool_min: 1,
    pool_idleTimeout: 1000, // in milliseconds
  });

  this.pg_pool = this._get("pool");
  if ( ! this.pg_pool ) {
    var pg_opts = {
      host: this._get("pg_host"),
      port: this._get("pg_port"),
      user: this._get("pg_user"),
      password: this._get("pg_password"),
      max: this._get("pool_max"),
      min: this._get("pool_max"),
      idleTimeoutMillis: this._get("pool_idleTimeout"),
      Promise: require('bluebird')
    };
    this.pg_pool = new pg.Pool(pg_opts);
    this.pg_pool.on('error', function (err, client) {
           // if an error is encountered by a client while it sits idle in the pool
           // the pool itself will emit an error event with both the error and
           // the client which emitted the original error
           // this is a rare occurrence but can happen if there is a network partition
           // between your application and the database, the database restarts, etc.
           // and so you might want to handle it and at least log it out
           console.error('idle client error', err.message, err.stack)
     });
  } // if this.pg_pool
}

var o = MapStore.prototype;

/// Internal method: get configuration item
o._get = function(key) {
  return this._config[key];
};

/// Internal method: get redis pool
o._pgPool = function() {
  return this.pg_pool;
};

/// Internal method: run redis command
//
/// @param func - the redis function to execute (uppercase required!)
/// @param args - the arguments for the redis function in an array
///               NOTE: the array will be modified
/// @param callback - function(err,val) function to pass results too.
///
o._pgCmd = function(sql, args, callback) {
  var client;
  var pool = this._pgPool();

  pool.connect(function(err, client, done) {
  if(err) {
    return console.error('error fetching client from pool', err);
  }
  client.query(sql, args, function(err, result) {
    //call `done()` to release the client back to the pool
    done();

    if(err) {
      return console.error('error running query', err);
    }
    callback(err, result);
  });
});


};

/// API: Load a saved MapStore object, renewing expiration time
//
/// Static method
///
/// @param id the MapStore identifier
/// @param callback function(err, mapConfig) callback function
///
o.load = function(id, callback) {
  var that = this;

  console.log('load');
};

/// API: store map to redis
//
/// @param map MapConfig to store
/// @param callback function(err, id, known) called when save is completed
///
o.save = function(map, callback) {
   //accept map with and id already
   var id = map._cfg._id || map.id();
   console.log(JSON.stringify(map, null, 2));
   this._pgCmd("INSERT INTO map_config (map_id, map_config) VALUES ($1,$2) ON CONFLICT (map_id) DO UPDATE SET map_config = EXCLUDED.map_config",
               [id, map.serialize()],
               function(err, result) {
                    console.log("saved map id: ", id);
                    callback(err);
               }
   );
};

/// API: delete map from store
//
/// @param map MapConfig to delete from store
/// @param callback function(err, id, known) called when save is completed
///
o.del = function(id, callback) {
  var that = this;
  var key = this._get("pg_key_mapcfg_prefix") + id;
  console.log('delete');
};


module.exports = MapStore;
