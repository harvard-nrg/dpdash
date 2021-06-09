require('@babel/register');
const webpack = require('webpack');
const path = require('path');

module.exports = {
  target: 'web',
  mode: process.env.NODE_ENV || 'production',
  entry: {
    study: './views/Study.render.react.js',
    admin: './views/Admin.render.react.js',
    main: './views/Main.render.react.js',
    login: './views/Login.render.react.js',
    register: './views/Register.render.react.js',
    reset: './views/Resetpw.render.react.js',
    account: './views/Account.render.react.js',
    editConfig: './views/EditConfig.render.react.js',
    config: './views/Config.render.react.js',
    deepdive: './views/DeepDive.render.react.js',
    graph: './views/Graph.render.react.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            plugins: [
              'react-html-attrs',
              '@babel/plugin-proposal-class-properties',
              ['@babel/plugin-proposal-decorators', { legacy: true }],
              ['@babel/plugin-transform-runtime', { legacy: true }]
            ],
            presets: [
              ["@babel/preset-react", {
                "runtime": "automatic"
              }],
              '@babel/preset-env',
            ],
            cacheDirectory: true,
          }
        }],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/[hash][ext][query]'
        }
      },
    ],
  },
  optimization: {
    minimize: true,
  },
  output: {
    path: path.resolve(__dirname, 'public')+'/js/',
    filename: '[name].min.js',
    publicPath: path.resolve(__dirname, 'public')+'/js/',
  },
  resolve: {
    fallback: {
      fs: false,
      net: false,
      tls: false,
    },
    extensions: [".js", ".jsx"]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      }
    }),
  ],
};
