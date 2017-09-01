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
        <SparqlConsole id="console" v-on:runQuery="openResult"></SparqlConsole>
      </div>
      <div v-else>
        <ResultView id="result">Results can be interesting</ResultView>
      </div>
    </div>
    <md-bottom-bar>
      <md-bottom-bar-item id="map-button" @click="currentView='map'" md-active>Map</md-bottom-bar-item>
      <md-bottom-bar-item id="query-button" @click="currentView='query'">Query</md-bottom-bar-item>
      <md-bottom-bar-item id="result-button" @click="currentView='result'">Result</md-bottom-bar-item>
    </md-bottom-bar>
  </div>
</template>

<script>
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
      openResult: function () {
        const resultButton = document.getElementById('result-button')
        resultButton.click()
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

</style>
