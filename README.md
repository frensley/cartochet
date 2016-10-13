## Cartochet
Simple client server example using Windshaft layer groups

## Database Setup

## Import major aquifers
>shp2pgsql -s 4269:3857 NEW_major_aquifers_dd.shp texas_major_aquifers sfrensley > major_aquifers.sql

>psql -d sfrensley -f major_aquifers.sql

## Import census shapes:
>shp2pgsql -s 4269:3857 cb_2015_us_state_500k.shp us_state sfrensley > us_state.sql

>psql -d sfrensley -f us_state.sql

## Import Kyle shapes:
>shp2pgsql -s 2278:3857 Kyle_Parcels_Feb2015.shp > kyle_parcels.sql

>psql -d sfrensley -f kyle_parcels.sql

>shp2pgsql -s 2278:3857 Kyle_Streets_Feb2015.shp > kyle_streets.sql

>psql -d sfrensley -f kyle_streets.sql

## Add necessary database functions
* test/sql/CDB_QueryStatement.sql
* test/sql/CDB_queryTables.sql

## Run server
>npm run-script server

## Run client
>npm run-script client


Some Contributing projects (definitely not all):
Leaflet
http://leafletjs.com/

Windshaft
https://github.com/CartoDB/Windshaft

Tabbed panels
http://code.stephenmorley.org/html-and-css/tabbed-panels/

Floating CSS labels
https://css-tricks.com/float-labels-css/

Leaflet Sidebar
https://github.com/Turbo87/leaflet-sidebar

Underscore
http://underscorejs.org/
