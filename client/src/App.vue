<template>
  <div id="app">
    <div>
      <div class="postcodeInput">Postcode:</div>
      <input class="postcodeInput" v-model="postcode" placeholder="BS20 6PT"></input>
      <button class="postcodeInput" v-on:click="query">Submit</button>
    </div>
    <GoogleMap></GoogleMap>
  </div>
</template>

<script>
  import GoogleMap from '@/components/GoogleMap'

  export default {
    name: 'app',
    data () {
      return {
        currentViz: 'map',
        postcode: ''
      }
    },
    computed () {
      return {
        postcode: this.postcode
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
        alert(`You submited ${this.postcode}`)
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
