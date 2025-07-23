const path = require('path')

// Set the UNI_CLI_CONTEXT if not set
if (!process.env.UNI_CLI_CONTEXT) {
  process.env.UNI_CLI_CONTEXT = __dirname
}

module.exports = {
  transpileDependencies: [],
  
  configureWebpack: {
    devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: [
            {
              loader: path.resolve(__dirname, 'recyclable-render-loader.js')
            }
          ],
          enforce: 'post'
        }
      ]
    }
  },

  css: {
    loaderOptions: {
      sass: {
        implementation: require('sass')
      },
      scss: {
        implementation: require('sass')
      }
    }
  }
}