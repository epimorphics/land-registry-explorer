<template>
  <div class="result-view">
    <div id="visualization" v-if="activeView==='data'">
      <div id="rowChartDataTable">
        <div class="row">
          <span class="title">Number of Sales per Property Type</span>
          <div id="rowChart"></div>
        </div>
        <div class="grid">
          <span class="title">Latest Property Sale</span>
          <div id="dataGrid"></div>
        </div>
      </div>
      <div class="bar">
        <span class="title">Average Price Paid per Year</span>
        <div id="barChart"></div>
      </div>
    </div>
    <div class="result-view" id="json" v-else-if="activeView==='result'">
      <pre>
  To visualize the data please return all of the following fields:
  paon, street, town, county, propertyType, postcode, amount, date
      </pre>
      <pre>Query Result as JSON:</pre> 
      <pre>{{result}}</pre>
    </div>
    <div class="invalid-query-view" v-else-if="activeView==='invalid'">
      <pre>Invalid Query</pre>
    </div>
  </div>
</template>

<script>
  const dc = require('dc')
  const d3 = require('d3')
  const crossfilter = require('crossfilter')
  
  export default {
    data () {
      return {
        result: this.$store.state.queryResult,
        requiredFields: ['paon', 'street', 'town', 'county', 'propertyType', 'postcode', 'amount', 'date'],
        activeView: 'data'
      }
    },
    mounted () {
      console.log(JSON.stringify(this.result))
      if (this.result.length === 0) {
        this.activeView = 'invalid'
        return
      }
      const mVue = this
      var hasAllRequiredFields = this.requiredFields.every(function (field) {
        return mVue.result[0].hasOwnProperty(field)
      })
      if (!hasAllRequiredFields) {
        this.activeView = 'result'
      } else {
        this.visualizeData()
      }
    },
    methods: {
      visualizeData: function () {
        var rowChart = dc.rowChart('#rowChart')
        var barChart = dc.barChart('#barChart')
        var dataGrid = dc.dataGrid('#dataGrid')

        var ndx = crossfilter(this.result)

        var propertyTypeDimension = ndx.dimension(function (d) {
          return d.propertyType
        })
        var propertyTypeGroup = propertyTypeDimension.group().reduceCount(function (d) {
          return d.amount
        })
        var yearDimension = ndx.dimension(function (d) {
          return d.date.toString().substring(11, 15)
        })
        var yearAvgGroup = yearDimension.group().reduce(
          /* callback for when data is added to the current filter results */
          function (p, v) {
            ++p.count
            p.total += v.amount
            p.average = p.count ? p.total / p.count : 0
            return p
          },
          /* callback for when data is removed from the current filter results */
          function (p, v) {
            --p.count
            p.total -= v.amount
            p.average = p.count ? p.total / p.count : 0
            return p
          },
          /* initialize p */
          function () {
            return {
              count: 0,
              total: 0,
              average: 0
            }
          }
        )

        var timeDimension = ndx.dimension(function (d) {
          return d.date.getTime()
        })

        var yearDomain = []
        for (var i = 1995; i < 2018; i++) {
          yearDomain.push(i.toString())
        }

        rowChart
          .width(260)
          .height(200)
          .group(propertyTypeGroup)
          .dimension(propertyTypeDimension)
          .ordinalColors(['#005E00', '#0F8500', '#35AB17', '#5BD13D', '#81F763'])
          .title(function (d) {
            return d.propertyType
          })
          .elasticX(true)
          .turnOnControls(true)

        rowChart.xAxis()
          .ticks(5)
          .tickSize(2)
          .tickPadding(10)

        barChart
          .width(500)
          .height(215)
          .dimension(yearDimension)
          .group(yearAvgGroup)
          .valueAccessor(function (p) {
            return p.value.average
          })
          .x(d3.scale.ordinal().domain(yearDomain))
          .xUnits(dc.units.ordinal)
          .elasticY(true)
          .yAxisLabel('')
          .elasticX(true)
          .xAxisLabel('Year')
          .renderHorizontalGridLines(true)
          .gap(1)
          .centerBar(false)
          .margins({top: 10, right: 0, bottom: 45, left: 65})

        barChart.xAxis()
          .tickFormat(d => '\'' + d.substring(2, 4))
          .tickSize(2)
          .tickPadding(10)

        barChart.yAxis()
          .tickFormat(d => d.toLocaleString('en-GB', {
            style: 'currency',
            currency: 'GBP',
            maximumFractionDigits: 0,
            minimumFractionDigits: 0
          }))
          .tickSize(2)

        dataGrid
          .dimension(timeDimension)
          .group(function (d) {
            return d.propertyType
          })
          .html(function (d) {
            const html = `<div><u>Address:</u> ${d.paon} ${d.street}</div>` +
              `<div><u>Town:</u> ${d.town}</div>` +
              `<div><u>County:</u> ${d.county}</div>` +
              `<div><u>Property Type:</u> ${d.propertyType}</div>` +
              `<div><u>Price Paid:</u> ${d.amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 })}</div>` +
              `<div><u>Date:</u> ${d.date.toLocaleString().substring(0, 10)}</div>`
            return html
          })
          .sortBy(function (d) {
            return d.date.getTime()
          })
          .size(1)

        dc.renderAll()
      }
    },
    computed: {
      updatedResult () {
        this.$store.state.queryResult
      }
    },
    watch: {
      updatedResult: function (newResult) {
        this.result = newResult
        dc.redrawAll()
      }
    }
  }
</script>

<style>
@import "../../node_modules/dc/dc.css";

.result-view {
  width: 550px;
  height: 470px;
  text-align: left;
  font-size: 13px;
}

#rowChartDataTable {
  width: 490px;
  height: 235px;
  margin-top: -10px;
  margin-right: 40px;
  margin-left: 20px;
  word-wrap: break-word;
  float: left;
}

#try {
  word-wrap: break-word;
}

.row {
  float: left;
  text-align: center;
  margin-right: 10px;
}

.grid {
  overflow: hidden;
}

.bar {
  margin-left: 20px;
}

#json {
  overflow-x: scroll;
  overflow-y: scroll;
}

#block {
  display: block;
}

.dc-grid-group {
  visibility: collapse;
  margin-bottom: -40px;
}

.title {
  display: block;
  text-align: center;
  font-size: 15px;
  font-weight: bold;
}

</style>