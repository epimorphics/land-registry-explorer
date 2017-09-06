# land-registry-explorer
land-registry-explorer is a web widget that visualizes the land registry data as well as provides an interface for a user to edit and run SPARQL queries.

In order to include the widget on any html page a single line of code is added defining an iframe element:
```html
<iframe src="http://web.epimorphics.net/lr-widget/" height="630px" width="600px" scrolling="no" frameborder="0"></iframe>
```

The project is developed using [Vue.js](https://vuejs.org/), a progressive JavaScript framework. The widget is split into three components: a map, a query console and a result page, all described in detail below. The state of the application is maintained using a state management pattern library called [Vuex](https://vuex.vuejs.org/en/intro.html).

## Map
For the map layer the [JavaScript Google Maps API](https://developers.google.com/maps/documentation/javascript/3.exp/reference) is used because it is well documented and simple to manipulate. Postcode areas that can be seen on the map have **_approximated_** boundaries. Postcode boundaries are not part of the open data and therefore an open source API called [postcodes.io](postcodes.io) is used. It provides center points of all UK postcodes and the postcode boundaries are approximated using the [voronoi diagram](https://en.wikipedia.org/wiki/Voronoi_diagram) which calculates the borders based on the distance to the nearest center point. An API call to the land registry API is made for each visible postcode area and the average price paid is calculated. The color scheme of the polygon areas is determined using the average price paid and it ranges from yellow(low price) through orange(medium price) to red(high price). If there was no sales in a particular postcode area since 01 January 1995 when the data collection started then the postcode area is colored in white.

<img src="https://raw.githubusercontent.com/epimorphics/land-registry-explorer/master/screenshots/map.png" width="530" height="579" align="middle"/>

## Query
SPARQL query console has been implemented using a [vue-codemirror](https://www.npmjs.com/package/vue-codemirror) library which proved to be really powerful whilst also being easy to use. The API provides with a huge amount of event listeners such as onBeforeChange and onSelectionChange which provide you with the full control of users interaction with the code. 

<img src="https://raw.githubusercontent.com/epimorphics/land-registry-explorer/master/screenshots/query.png" width="530" height="579" align="middle"/>

## Result
The query result visualization is done using a JavaScript charting library called [dc.js](https://dc-js.github.io/dc.js/). Charts rendered using dc.js are data driven and reactive and therefore provide instant feedback to user interaction as well as a simple way to filter the data. If query entered by the user generates an error the result page will render the returned query exception. If the user omits some of the fields required for the visualization then the result page will render the query result in JSON format.

<img src="https://raw.githubusercontent.com/epimorphics/land-registry-explorer/master/screenshots/result.png" width="530" height="579" align="middle"/>

This widget can be found useful by anyone wanting to explore the land registry data or get a better understanding of SPARQL queries. A good improvement can be generalizing it so that easy integration of other datasets is possible.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```
