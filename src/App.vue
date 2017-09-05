<template>
  <div id="app">
    <div>
      <md-input-container>
          <label>Postcode</label>
        <md-input v-model="selectedPostcode"></md-input>
      </md-input-container>
    </div>
    <div>
      <div v-if="currentView==='map'">
        <GoogleMap id="gmap" ref="gmap"></GoogleMap>
      </div>
      <div v-else-if="currentView==='query'">
        <SparqlConsole id="console" v-on:runQuery="runQuery"></SparqlConsole>
      </div>
      <div v-else>
        <ResultView id="result">Results can be interesting</ResultView>
      </div>
    </div>
    <md-bottom-bar>
      <md-bottom-bar-item md-icon="map" id="map-button" @click="currentView='map'" md-active>Map</md-bottom-bar-item>
      <md-bottom-bar-item md-icon="code" id="query-button" @click="currentView='query'">Query</md-bottom-bar-item>
      <md-bottom-bar-item md-icon="equalizer" id="result-button" @click="runQuery">Result</md-bottom-bar-item>
    </md-bottom-bar>
  </div>
</template>

<script>
  const axios = require('axios')
  // const d3 = require('d3-sparql')

  import GoogleMap from '@/components/GoogleMap'
  import SparqlConsole from '@/components/SparqlConsole'
  import ResultView from '@/components/ResultView'

  export default {
    name: 'app',
    data () {
      return {
        currentView: 'map',
        endpoint: 'http://landregistry.data.gov.uk/landregistry/query'
      }
    },
    components: {
      GoogleMap,
      SparqlConsole,
      ResultView
    },
    methods: {
      openResult: function () {
        const resultButton = document.getElementById('result-button')
        resultButton.click()
      },
      setCurrentViewResult: function () {
        console.log(this.$refs)
        this.$refs.sparqlconsole.runQuery()
      },
      runQuery: function () {
        const mVue = this
        const url = mVue.endpoint + '?query=' + encodeURIComponent(mVue.code)
        axios.get(url, {
          headers: {
            'Accept': 'application/sparql-results+json'
          }
        }).then(function (response) {
          const data = mVue.parseQueryResult(response.data.results.bindings)
          // console.log(`RESPONSE: ${JSON.stringify(result)}`)
          mVue.$store.commit('updateQueryStatusCode', response.status)
          mVue.$store.commit('updateQueryResult', data)
        }).catch((error) => {
          if (error) {
            mVue.$store.commit('updateQueryStatusCode', error.response.status)
            mVue.$store.commit('updateQueryResult', error.response.data)
          }
        })
        // d3.sparql(this.endpoint, this.code, function (error, data) {
        //   if (error) throw error
        //   console.log(JSON.stringify(data))
        //   mVue.$store.commit('updateQueryResult', data)
        // })
      },
      parseQueryResult: function (input) {
        const mVue = this
        return input.map(function (row) {
          var rowObject = {}
          Object.keys(row).forEach(function (column) {
            rowObject[column] = mVue.dataTypeCast(row[column])
          })
          // console.log(JSON.stringify(rowObject))
          return rowObject
        })

        // const mVue = this
        // // console.log(`parseQueryResult, input: ${JSON.stringify(input)}`)
        // var results = []
        // input.forEach(function (element) {
        //   var result = {}
        //   element.forEach(function (field) {
        //     var parsedField = {}
        //     parsedField[field.key] = mVue.dataTypeCast(field)
        //   })
        //   console.log(`single item: ${JSON.stringify(element)}`)
        //   result.push(item)
        // })
        // return result
      },
      dataTypeCast: function (obj) {
        const xmlSchema = 'http://www.w3.org/2001/XMLSchema#'
        var value = obj.value
        if (typeof obj.datatype === 'undefined') {
          return value
        }
        var dataType = obj.datatype.replace(xmlSchema, '')
        switch (dataType) {
          case 'string':
            value = new String(value) // eslint-disable-line
            break
          case 'boolean':
            value = new Boolean(value === 'false' ? false : value) // eslint-disable-line
            break
          case 'float':
          case 'integer':
          case 'long':
          case 'double':
          case 'decimal':
          case 'nonPositiveInteger':
          case 'nonNegativeInteger':
          case 'negativeInteger':
          case 'int':
          case 'unsignedLong':
          case 'positiveInteger':
          case 'short':
          case 'unsignedInt':
          case 'byte':
          case 'unsignedShort':
          case 'unsignedByte':
            value = new Number(value) // eslint-disable-line
            break
          case 'date':
          case 'time':
          case 'dateTime':
            value = new Date(value)
            break
        }
        return value
      }
    },
    computed: {
      selectedPostcode: {
        get: function () {
          return this.$store.state.postcode
        },
        set: function (newPostcode) {
          this.$store.commit('updatePostcode', newPostcode)
        }
      },
      queryResult: {
        get: function () {
          return this.$store.state.queryResult
        }
      },
      code: {
        get: function () {
          return this.$store.getters.code
        }
      }
    },
    watch: {
      queryResult: function () {
        this.currentView = 'result'
      }
    }
  }
</script>

<style>
@import "../node_modules/vue-material/dist/vue-material.css";
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: auto;
  margin-top: 60px;
  width: 550px;
  height: 600px;
  box-shadow: 1px 2px 2px 0px rgba(0,0,0,0.11);
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

.md-bottom-bar {
  box-shadow: 0px 0px 0px 0px rgba(0,0,0,0);
}

.md-bottom-bar-item {
  max-width: 200px
}

</style>
