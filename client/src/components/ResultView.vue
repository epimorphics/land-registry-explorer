<template>
  <div class="result-view">
    <pre>{{result}}</pre>
  </div>
</template>

<script>
  export default {
    data () {
      return {}
    },
    computed: {
      result () {
        return JSON.stringify(this.$store.state.queryResult, undefined, 4)
      }
    }
  }
</script>

<style scoped>
.result-view {
  width: 450px;
  height: 350px;
  text-align: left;
  font-size: 10px;
  overflow-x: scroll;
  overflow-y: scroll;
}
</style>