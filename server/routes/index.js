'use strict';

const express = require('express');

const router = express.Router();

const mongodb = require('mongodb');

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/local', {
    useMongoClient: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/*
* Returns postcodes bounded by the rectangle bounded by the two given points.
* Data is returned as an array of GeoJSON features
*
* lat1 - Latitude of the top left corner
* lon1 - Longitude of the top left corner
* lat3 - Latitude of the bottom right corner
* lon3 - Longitude of the bottom right corner
*/
router.get('/postcodes/within/:lat1/:lon1/:lat3/:lon3/', function(req, res) {
  const lat1 = parseFloat(req.params.lat1);
  const lon1 = parseFloat(req.params.lon1);
  
  const lat3 = parseFloat(req.params.lat3);
  const lon3 = parseFloat(req.params.lon3);
  
  const lat2 = lat1;
  const lon2 = lon3;
  
  const lat4 = lat3;
  const lon4 = lon1;

  const postcodes = db.collection('postcodes');
  
  postcodes.find({
    geometry: { 
      $geoIntersects: { 
        $geometry: { 
          type: "Polygon", 
          coordinates: [ 
            [ 
              [ lon1, lat1 ],
              [ lon2, lat2 ],
              [ lon3, lat3 ],
              [ lon4, lat4 ],
              [ lon1, lat1 ] 
            ]
          ]
        }
      }
    }
  }).toArray(function (err, result) {
    if (err) {
      console.log(err);
      res.send([]);
    } else {
      console.log('Found:', result);
      res.status(200).send(result);
      res.end();
    }
  });

});

module.exports = router;
