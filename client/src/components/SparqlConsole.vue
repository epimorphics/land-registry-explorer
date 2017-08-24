<template>
  <div class="sparql-console">
    <!-- codemirror -->
    <codemirror id="codemirror"
                v-model="code" 
                :options="editorOption"
                @change="onEditorChange">
    </codemirror>
    <div>
      <md-button id="run-query" class="md-raised" @click="runQuery">Run Query</md-button>
    </div>
  </div>
</template>

<script>
  const d3 = require('d3-sparql')

  export default {
    data () {
      return {
        code: this.$store.getters.code,
        endpoint: 'http://landregistry.data.gov.uk/landregistry/query',
        editorOption: {
          tabSize: 2,
          foldGutter: true,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          matchBrackets: true,
          mode: {
            ext: 'vue'
          },
          theme: 'base16-light'
        }
      }
    },
    methods: {
      onEditorChange (code) {
        console.log('onEditorChange')
      },
      runQuery () {
        const mVue = this
        d3.sparql(this.endpoint, this.code, function (error, data) {
          if (error) throw error
          mVue.$store.commit('updateQueryResult', data)
        })
      }
    },
    computed: {
      postcode () {
        return this.$store.state.postcode
      }
    },
    watch: {
      postcode: function () {
        this.code = this.$store.getters.code
      }
    }
  }
</script>

<style scoped>
.sparql-console {
  width: 450px;
  height: 350px;
  text-align: left;
}

#run-query {
  background-color: #4CAF50;
  float: right;
}
</style>