<template>
  <div class="sparql-console">
    <!-- codemirror -->
    <codemirror id="codemirror"
                v-model="code" 
                :options="editorOption"
                @changes="onEditorChanges"
                @beforeChange="onEditorBeforeChange"
                @beforeSelectionChange="onEditorBeforeSelectionChange">
    </codemirror>
    <div class="my-fab">
      <md-button @click="runQuery" class="md-fab"></md-button>
    </div>
  </div>
</template>

<script>
  const d3 = require('d3-sparql')

  export default {
    data () {
      return {
        endpoint: 'http://landregistry.data.gov.uk/landregistry/query',
        editorOption: {
          inputStyle: 'contenteditable',
          tabSize: 2,
          foldGutter: true,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          matchBrackets: true,
          mode: 'application/sparql-query',
          theme: 'base16-light'
        }
      }
    },
    methods: {
      runQuery: function () {
        const mVue = this
        d3.sparql(this.endpoint, this.code, function (error, data) {
          if (error) throw error
          mVue.$store.commit('updateQueryResult', data)
        })
      },
      getIndexAt: function (string, line, char) {
        var currentLine = 0
        for (var x = 0; x < string.length; x++) {
          if (string[x] === '\n') {
            currentLine++
            continue
          }
          if (currentLine === line) {
            return x + char
          }
        }
        // var string = inputString
        // var index = 0
        // for (var x = 0; x < line; x++) {
        //   index = string.indexOf('\n')
        // }
      },
      onEditorBeforeSelectionChange: function (codemirror, changeObject) {
        const ranges = JSON.parse(JSON.stringify(changeObject.ranges))
        ranges[0].head = JSON.parse(JSON.stringify(changeObject.ranges[0].anchor))
        changeObject.update(ranges)
      },
      onEditorBeforeChange: function (codemirror, changeObject) {
        if (changeObject.origin !== '+delete' && changeObject.origin !== '+input' && changeObject.origin !== 'setValue') {
          changeObject.cancel()
        }
      },
      onEditorChanges: function (codemirror, changeObjects) {
        const newEditorState = codemirror.getValue()
        const postcodeStartIndex = this.queryPrefix.length
        const postcodeEndIndex = postcodeStartIndex + this.postcode.length
        // console.log(`Current Postcode: ${this.code.substring(postcodeStartIndex, postcodeEndIndex)}`)
        // console.log(`onEditorChange: ${JSON.stringify(changeObjects)}`)
        // console.log(`postcodeStartIndex value: ${this.code[postcodeStartIndex]}`)
        // console.log(`postcodeEndIndex value: ${this.code[postcodeEndIndex]}`)
        // console.log(`onEditorChange: ${codemirror.getValue()}`)
        for (var i = 0; i < changeObjects.length; i++) {
          const changeObject = changeObjects[i]
          if (changeObject.origin === '+delete') {
            const deletedCharIndex = this.getIndexAt(codemirror.getValue(), changeObject.from.line, changeObject.from.ch)
            if (deletedCharIndex < postcodeStartIndex) { // Change in query prefix
              this.queryPrefix = newEditorState.substring(0, postcodeStartIndex - 1)
            } else if (deletedCharIndex < postcodeEndIndex) { // Change in the postcode
              this.postcode = newEditorState.substring(postcodeStartIndex, postcodeEndIndex - 1)
            } else { // Change in query postfix
              this.queryPostfix = newEditorState.substring(postcodeEndIndex, newEditorState.length)
            }
          } else if (changeObject.origin === '+input') {
            const newCharIndex = this.getIndexAt(codemirror.getValue(), changeObject.from.line, changeObject.from.ch)
            if (newCharIndex < postcodeStartIndex) { // Change in query prefix
              this.queryPrefix = newEditorState.substring(0, postcodeStartIndex + 1)
            } else if (newCharIndex <= postcodeEndIndex) { // Change in the postcode
              this.postcode = newEditorState.substring(postcodeStartIndex, postcodeEndIndex + 1)
            } else { // Change in query postfix
              this.queryPostfix = newEditorState.substring(postcodeEndIndex, newEditorState.length)
            }
          }
        }
        console.log(this.code === newEditorState)
      }
    },
    computed: {
      postcode: {
        get: function () {
          return this.$store.state.postcode
        },
        set: function (newPostcode) {
          this.$store.commit('updatePostcode', newPostcode)
        }
      },
      code: {
        get: function () {
          return this.$store.getters.code
        },
        set: function (newCode) {

        }
      },
      queryPrefix: {
        get: function () {
          return this.$store.state.queryPrefix
        },
        set: function (newQueryPrefix) {
          this.$store.commit('updateQueryPrefix', newQueryPrefix)
        }
      },
      queryPostfix: {
        get: function () {
          return this.$store.state.queryPostfix
        },
        set: function (newQueryPostfix) {
          this.$store.commit('updateQueryPostfix', newQueryPostfix)
        }
      },
      queryResult () {
        return this.$store.state.queryResult
      }
    },
    watch: {
      queryResult: function () {
        this.$emit('runQuery')
      }
    }
  }
</script>

<style scoped>
.sparql-console {
  width: 550px;
  height: 470px;
  text-align: left;
}

#run-query {
  background-color: #4CAF50;
  float: right;
}

.my-fab {
  position: relative;
  bottom: 75px;
  left: 470px;
  z-index: 5;
}
</style>