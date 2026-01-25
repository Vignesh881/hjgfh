/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Webpack configuration for SQLite integration with react-scripts
// This file provides the configuration needed to enable sql.js in the browser environment

const path = require('path');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add polyfills for Node.js modules that sql.js requires
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "fs": false,
    "path": require.resolve("path-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "util": require.resolve("util"),
    "assert": require.resolve("assert"),
    "os": false,
    "url": require.resolve("url"),
    "https": false,
    "http": false,
    "net": false,
    "tls": false,
    "zlib": require.resolve("browserify-zlib")
  };

  // Add plugins for polyfills
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ];

  // Handle .wasm files for sql.js
  config.module.rules.push({
    test: /\.wasm$/,
    type: 'asset/resource',
  });

  // Copy sql.js WASM files to public directory
  config.module.rules.push({
    test: /sql\.js$/,
    use: [
      {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'static/js/',
        },
      },
    ],
  });

  return config;
};

/*
 * To enable SQLite support, follow these steps:
 * 
 * 1. Install required dependencies:
 *    npm install --save-dev react-app-rewired
 *    npm install --save-dev path-browserify crypto-browserify stream-browserify
 *    npm install --save-dev buffer util assert url browserify-zlib
 *    npm install --save-dev process
 * 
 * 2. Rename this file to config-overrides.js in the project root
 * 
 * 3. Update package.json scripts:
 *    "scripts": {
 *      "start": "react-app-rewired start",
 *      "build": "react-app-rewired build",
 *      "test": "react-app-rewired test"
 *    }
 * 
 * 4. Copy sql-wasm.wasm to public directory:
 *    npm run postinstall
 * 
 * 5. Update database.js to use local WASM file:
 *    Change: locateFile: file => `https://sql.js.org/dist/${file}`
 *    To:     locateFile: file => `/sql.js/${file}`
 * 
 * 6. Uncomment database imports in App.jsx
 * 
 * This configuration enables full SQLite support with WebAssembly in the browser.
 * The current localStorage implementation provides similar functionality without
 * the complexity of webpack configuration.
 */