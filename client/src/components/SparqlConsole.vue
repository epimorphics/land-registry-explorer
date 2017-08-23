<template>
  <div class="sparql-console">
    <!-- codemirror -->  
    <codemirror id="codemirror"
                v-model="code" 
                :options="editorOption"
                @cursorActivity="onEditorCursorActivity"
                @ready="onEditorReady"
                @focus="onEditorFocus"
                @blur="onEditorBlur">
    </codemirror>
  </div>
</template>

<script>
  export default {
    props: ['postcode'],
    data () {
      var code = `<h1> Hello From ${this.postcode}! </h1>`
      return {
        code,
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
      onEditorCursorActivity (codemirror) {
        console.log('onEditorCursorActivity', codemirror)
      },
      onEditorReady (codemirror) {
        console.log('onEditorReady', codemirror)
      },
      onEditorFocus (codemirror) {
        console.log('onEditorFocus', codemirror)
      },
      onEditorBlur (codemirror) {
        console.log('onEditorBlur', codemirror)
      }
    },
    watch: {
      postcode: function () {
        console.log(this.postcode)
      }
    }
  }
</script>

<style scoped>
.sparql-console {
  width: 450px;
  height: 300px;
  text-align: left; 
}
</style>