'use strict';

var fs = require('file-system');
var path = require('path');

var axios = require('axios');
var Promise = require("bluebird");

var JSONStream = require('JSONStream');
var es = require('event-stream');

var i = 0;

var urls = []

var in_stream = JSONStream.parse(['features', true ]) //rows, ANYTHING, doc 

in_stream.on('data', function(data) {
  if (i % 200 == 0) {
    var url = `http://landregistry.data.gov.uk/data/ppi/transaction-record.json?_page=0&propertyAddress.postcode=${data.properties.pcd}&_pageSize=50`;
    url = url.replace(` `, `%20`)
    urls.push(url)
  }
  i = i + 1;
});

//emits anything from _before_ the first match 
// in_stream.on('header', function (data) {
//   console.log('header:', data);
// })

in_stream.on('end', function(){
  i = 0;
  var maxResult = 0;
  var minResult = Infinity;
  var totalResult = 0;
  Promise.map(urls, url => axios.get(url).then((response) => {
    // console.log(url);
    const result = response.data.result;
    const total = result.items.size;
    totalResult = totalResult + total;
    if(total < minResult) minResult = total;
    if(total > maxResult) maxResult = total;
    i = i + 1;
  }).catch((error) => {
    console.log(error);
  }), { concurrency: 10 }).then(() => {
    console.log("DONE!");
    var avgResult = totalResult / i;
    console.log(`Total Postcodes examined: ${i}`);
    console.log(`Average Sales per Postcode: ${avgResult}`);
    console.log(`Maximum Sales per Postcode: ${maxResult}`);
    console.log(`Minimum Sales per Postcode: ${minResult}`);
    process.exit();
  });
})

const read_stream = fs.createReadStream('./postcode_simple.json')
.pipe(in_stream);

