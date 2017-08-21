<template>
  <div id="app">
    <div>
      <div class="postcodeInput">Postcode:</div>
      <input class="postcodeInput" v-model="postcode" placeholder="BS20 6PT"></input>
      <button class="postcodeInput" v-on:click="query">Submit</button>
    </div>
    <GoogleMap v-ref="gmap" :center="center"></GoogleMap>
    <p>{{postcode}}</p>
  </div>
</template>

<script>
  import GoogleMap from '@/components/GoogleMap'

  const axios = require('axios')

  export default {
    name: 'app',
    data () {
      return {
        currentViz: 'map',
        postcode: '',
        center: new window.google.maps.LatLng(51.480238, -2.768048)
      }
    },
    computed () {
      return {
        postcode: this.postcode,
        center: this.center
      }
    },
    // watch: {
    //   postcode: function (newPostcode) {
    //     this.postcode = newPostcode
    //   }
    // },
    components: {
      GoogleMap
    },
    methods: {
      query: function () {
        const url = `/postcodes/center/${this.postcode}`
        console.log(`URL: ${url}`)

        axios.get(url).then((response) => {
          const result = response.data
          this.center = new window.google.maps.LatLng(result[1], result[0])
          // this.$ref('updateMapCenter', this.center)
        }).catch((error) => {
          console.log(`Error: ${error}`)
        })
      }
    }
  }
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
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

.postcodeInput {
  display: inline-block;
  margin: 10px auto;
}
</style>
