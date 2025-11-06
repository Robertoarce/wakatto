const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  // Force fresh build - cache buster
  console.log('🔥 CUSTOM WEBPACK CONFIG LOADED - Build time:', new Date().toISOString());
  
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons'],
      },
    },
    argv
  );
  
  // Disable webpack caching completely
  config.cache = false;
  
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
  
  // Force new output file names
  if (config.output) {
    config.output.filename = config.output.filename?.replace('[contenthash]', `[contenthash].${Date.now()}`);
    config.output.chunkFilename = config.output.chunkFilename?.replace('[contenthash]', `[contenthash].${Date.now()}`);
  }
  
  // Add plugins for global polyfills
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];
  
  console.log('✅ Webpack config customizations applied');
  
  return config;
};

