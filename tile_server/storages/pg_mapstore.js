// Map configuration storage

//var step       = require('step');
var _          = require('windshaft/node_modules/underscore');
var MapConfig  = require('windshaft/lib/windshaft/models/mapconfig');
var assert = require('assert');
var pg = require('pg');
var step       = require('windshaft/node_modules/step');

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

var _jsonb_set_template = _.template("jsonb_set(<%= target %>, '<%= path %>', '<%= value %>')");
var jsonb_set = function(target, path, value) {
    return _jsonb_set_template({target: target, path: path, value: JSON.stringify(escape(value))});
}
var escape = function(string) {
    var escaped = string.replace(/'/g,"''");
    return escaped;
}


/// Internal method: get configuration item
o._get = function(key) {
  return this._config[key];
};

/// Internal method: get pg pool
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
  console.log('load: ', id);
  this._pgCmd("SELECT map_config FROM map_config WHERE map_id = $1", [id], function(err, results) {
     assert.ifError(err);
     if ( results.rowCount == 0 ) {
          throw new Error("Invalid or nonexistent map configuration token '" + id + "'");
     }
     step(
        function processResults() {
          return results.rows[0].map_config;
        },
        function instantiateConfig(err, serializedMapConfig) {
           assert.ifError(err);
           var obj = MapConfig.create(serializedMapConfig);
           //serialization to PG breaks stuff
           obj._id = id;
           console.log("object: ", JSON.stringify(obj, null, 2));
           return obj;
        },
        function finish(err, obj) {
           callback(err, obj);
        }
   ); //step
  }); // pgCmd
};

/// API: store map to redis
//
/// @param map MapConfig to store
/// @param callback function(err, id, known) called when save is completed
///
o.save = function(map, callback) {
   //accept map with and id already
   var id = map.id();
   var config_id = map._cfg.config_id;
   console.log("save mapconfig: ", JSON.stringify(map, null, 2));
   this._pgCmd("INSERT INTO map_config (map_id, config_id, map_config) VALUES ($1,$2, $3) ON CONFLICT (config_id) DO UPDATE SET (map_id, map_config) = (EXCLUDED.map_id, EXCLUDED.map_config)",
               [id, config_id, map.serialize()],
               function(err, result) {
                    console.log("saved map id: ", id);
                    callback(err);
               }
   );
};

// id is the config_id in map_config table
// options is an array of objects that contain the updated sql and cartocss
o.updateOptions = function(id, data, callback) {
    console.log("updating options for id", id);
    console.log("updating options ", data);
    if (data) {
        if (Array.isArray(data.options)) {
            var len = data.options.length;
            for (var i = 0; i < len; i++) {
                var set = jsonb_set("map_config", "{layers," + i + ", options, sql}", data.options[i].sql);
                set = jsonb_set(set, "{layers," + i + ", options, cartocss}", data.options[i].style);
                console.log('options' + i + ': ' + set);
                this._pgCmd("UPDATE map_config SET map_config = " + set + " where config_id = '" + id + "'", [], function (err) {
                    console.log('updated options' + i);
                });
            }
        }
        if (data.layer_name) {
            var set = jsonb_set("map_config", "{name}", data.layer_name);
            this._pgCmd("UPDATE map_config SET map_config = " + set + " where config_id = '" + id + "'", [], function (err) {
                console.log('updated layer name');
            });
        }
    }
    callback(null,null);
}



/// API: delete map from store
//
/// @param map MapConfig to delete from store
/// @param callback function(err, id, known) called when save is completed
///
o.del = function(id, callback) {
  var that = this;
  var key = this._get("pg_key_mapcfg_prefix") + id;
  console.trace('delete');
  callback(null,null);
};

o.listLayers = function(callback) {
     this._pgCmd("SELECT map_id, map_config FROM map_config", [], function(err, result) {
          callback(err,result);
     });
}

module.exports = MapStore;
