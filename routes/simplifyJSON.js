var fs = require('fs');
var JSONStream = require('JSONStream');
var es = require('event-stream');

var i = 0;

var out_stream = fs.createWriteStream('./postcode_simple.json');

var in_stream = JSONStream.parse(['features', true ]) //rows, ANYTHING, doc 

in_stream.on('data', function(data) {
  var simple = {}
  simple.type = data.type;
  simple.properties = { pcd: data.properties.pcd };
  simple.geometry = data.geometry;
  out_stream.write(JSON.stringify(simple));
  out_stream.write(",\n");
  if (i % 10000 == 0) {
    console.log(i);
  }
  i = i + 1;
});

//emits anything from _before_ the first match 
in_stream.on('header', function (data) {
  console.log('header:', data);
  out_stream.write(`{"type":"FeatureCollection","features":[\n`);
})

in_stream.on('end', function(){
  out_stream.write("]}")
  out_stream.end();
  console.log("DONE!");
})

fs.createReadStream('./postcode_centroids.json')
.pipe(in_stream);
