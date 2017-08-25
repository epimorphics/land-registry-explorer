<template>
  <div class="result-view">
    <div v-if="canVisualize">
      <span>Number of sales per property type</span>
      <div id="pieChart"></div>
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
      var ndx = crossfilter(this.result)
      var propertyTypeDimension = ndx.dimension(function (d) {
        return d.propertyType
      })
      var propertyTypeGroup = propertyTypeDimension.group().reduceCount(function (d) {
        return d.amount
      })

      var colorScale = d3.scaleOrdinal()
        .domain(['terraced', 'semi-detached', 'detached', 'flat-maisonette'])
        .range(['#D82C8C', '#17A7CF', '#E58304', '#BBCCEE'])

      pieChart.width(200)
        .height(200)
        .slicesCap(4)
        .dimension(propertyTypeDimension)
        .group(propertyTypeGroup)
        .colors(colorScale)
        .label((d) => {
          return `${d.key}(${d.value})`
        })

      pieChart.render()
    }
  }
</script>

<style scoped>
.result-view {
  width: 450px;
  height: 350px;
  text-align: left;
  font-size: 10px;
}

#json {
  overflow-x: scroll;
  overflow-y: scroll;
}
</style>