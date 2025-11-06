const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');
const path = require('path');

module.exports = async function (env, argv) {
  // Force fresh build - cache buster
  console.log('🔥 CUSTOM WEBPACK CONFIG LOADED - Build time:', new Date().toISOString());
  
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@expo/vector-icons',
          '@react-navigation/elements',
          'react-native-safe-area-context',
        ],
      },
    },
    argv
  );
  
  // Disable webpack caching completely
  config.cache = false;
  
  // Override entry point for more control
  config.entry = path.resolve(__dirname, 'index.web.js');
  
  // Ensure output directory
  config.output = {
    ...config.output,
    path: path.resolve(__dirname, 'web-build'),
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].js',
    publicPath: '/',
  };
  
  // Add node polyfills for Supabase
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: 'crypto-browserify',
    stream: 'stream-browserify',
    buffer: 'buffer',
    process: 'process/browser',
    util: 'util',
    assert: 'assert',
    vm: false, // vm is not needed in browser
  };
  
  // CRITICAL: Set target to web to avoid Node.js-specific code
  config.target = 'web';
  
  // Add plugins for global polyfills
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      // This will make code like `if (typeof require !== 'undefined')` evaluate to false
      'typeof require': JSON.stringify('undefined'),
      '__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
      // Ensure process.env is defined
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    new webpack.BannerPlugin({
      banner: `/* Wakatto Build: ${Date.now()} | Polyfills: active | Target: web */`,
      raw: true,
      entryOnly: false,
    }),
  ];
  
  // Force all modules to be treated as web modules
  config.resolve.mainFields = ['browser', 'module', 'main'];
  
  // Replace the problematic useFrameSize module with our web-compatible version
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /@react-navigation\/elements.*useFrameSize/,
      path.resolve(__dirname, 'src/patches/useFrameSize.web.js')
    )
  );
  
  console.log('✅ Webpack config customizations applied');
  console.log('   - Entry:', config.entry);
  console.log('   - Target:', config.target);
  console.log('   - Output:', config.output.path);
  
  return config;
};
