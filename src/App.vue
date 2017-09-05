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
        <ResultView id="result"></ResultView>
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

  import GoogleMap from '@/components/GoogleMap'
  import SparqlConsole from '@/components/SparqlConsole'
  import ResultView from '@/components/ResultView'

  export default {
    name: 'app',
    data () {
      return {
        currentView: 'map'
      }
    },
    components: {
      GoogleMap,
      SparqlConsole,
      ResultView
    },
    methods: {
      // Opens the result tab by clicking on the bottom menu item
      openResult: function () {
        const resultButton = document.getElementById('result-button')
        resultButton.click()
      },
      // Runs the query found in sparql console and updates Vuex state of the response code and the response itself
      runQuery: function () {
        const mVue = this
        const url = `http://landregistry.data.gov.uk/landregistry/query?query=${encodeURIComponent(mVue.code)}`
        axios.get(url, {
          headers: {
            'Accept': 'application/sparql-results+json'
          }
        }).then(function (response) {
          const data = mVue.parseQueryResult(response.data.results.bindings)
          mVue.$store.commit('updateQueryStatusCode', response.status)
          mVue.$store.commit('updateQueryResult', data)
        }).catch((error) => {
          if (error) {
            mVue.$store.commit('updateQueryStatusCode', error.response.status)
            mVue.$store.commit('updateQueryResult', error.response.data)
          }
        })
      },
      // Strips down sparql query result to a simple json form
      parseQueryResult: function (result) {
        const mVue = this
        return result.map(function (row) {
          var rowObject = {}
          Object.keys(row).forEach(function (column) {
            rowObject[column] = mVue.dataTypeCast(row[column])
          })
          return rowObject
        })
      },
      // Casts an object value into a corresponding data type found in the object properties
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
      // As soon as the state of queryResult is updated open the results view
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
