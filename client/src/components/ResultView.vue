<template>
  <div class="result-view">
    <div id="visualization" v-if="canVisualize">
      <div>
        <div class="inline">
          <span>Number of sales per property type</span>
          <div id="pieChart"></div>
        </div>
        <div class="inline">
          <span>Latest Property Sale</span>
          <div id="dataGrid"></div>
        </div>
      </div>
      <span id="title">Average Price Paid per Year</span>
      <div id="barChart"></div>
    </div>
    <div class="result-view" id="json" v-else>
      <pre>{{result}}</pre>
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
        canVisualize: true
      }
    },
    mounted () {
      var pieChart = dc.pieChart('#pieChart')
      var barChart = dc.barChart('#barChart')
      // var dataTable = dc.dataTable('#dataTable')
      // <div class='inline' id='dataTable'>
      //   <div class='header'>
      //     <span id='title'>Latest Transaction</span>
      //     <span id='block'>Address:</span>
      //     <span id='block'>Price Paid:</span>
      //     <span id='block'>Property Type:</span>
      //     <span id='block'>Date:</span>
      //   </div>
      // </div>
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

      var dateDimension = ndx.dimension(function (d) {
        return d.date.toLocaleString().substring(0, 10)
      })

      var colorScale = d3.scale.ordinal()
        .domain(['terraced', 'semi-detached', 'detached', 'flat-maisonette'])
        .range(['#D82C8C', '#17A7CF', '#E58304', '#BBCCEE'])

      pieChart
        .width(150)
        .height(150)
        .slicesCap(4)
        .dimension(propertyTypeDimension)
        .group(propertyTypeGroup)
        .colors(colorScale)
        .label((d) => {
          return `${d.key}(${d.value})`
        })
        .externalRadiusPadding(10)

      var yearDomain = []
      for (var i = 1995; i < 2018; i++) {
        yearDomain.push(i.toString())
      }

      barChart
        .width(400)
        .height(170)
        .dimension(yearDimension)
        .group(yearAvgGroup)
        .valueAccessor(function (p) {
          return p.value.average
        })
        .x(d3.scale.ordinal().domain(yearDomain))
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .xAxisLabel('Year')
        .elasticX(true)
        .yAxisLabel('')
        .gap(1)
        .centerBar(false)
        .margins({top: 10, right: 0, bottom: 45, left: 55})

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
          .dimension(dateDimension)
          .group(function (d) {
            return d.propertyType
          })
          .html(function (d) { return `<div>Address: ${d.paon} ${d.street} PP: ${d.amount}</div>` })
          .size(1)
          .sortBy(function (d) {
            return d.date.toLocaleString().substring(0, 10)
          })
          .order(d3.ascending)

      // dataTable
      //   .dimension(dateDimension)
      //   .group(function (d) {
      //     return d.propertyType
      //   })
      //   .columns([
      //     function (d) { return `${d.paon} ${d.street}\n` },
      //     function (d) {
      //       return d.amount.toLocaleString('en-GB', {
      //         style: 'currency',
      //         currency: 'GBP',
      //         maximumFractionDigits: 2,
      //         minimumFractionDigits: 2
      //       })
      //     },
      //     function (d) { return d.propertyType },
      //     function (d) { return d.date.toLocaleString().substring(0, 10) }
      //   ])
      //   .size(1)
      //   .sortBy(function (d) {
      //     return d.date.toLocaleString().substring(0, 10)
      //   })
      //   .order(d3.ascending)
      //   .on('renderlet', function (table) {
      //     table.selectAll('.dc-table-group').classed('info', true)
      //   })

      dc.renderAll()
    }
  }
</script>

<style scoped>
.result-view {
  width: 450px;
  height: 350px;
  text-align: left;
  font-size: 7px;
}

#json {
  overflow-x: scroll;
  overflow-y: scroll;
}

.inline {
  display: inline-block;
}

#block {
  display: block;
}

#title {
  display: block;
  text-align: center;
}

</style>