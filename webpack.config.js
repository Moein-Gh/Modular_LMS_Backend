// Custom Webpack config to make Webpack respect TypeScript path aliases from tsconfig.json
// This fixes "Can't resolve '@app/*'" errors during Nest's webpack build.

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = (options, webpack) => {
    options.resolve = options.resolve || {};
    options.resolve.plugins = options.resolve.plugins || [];

    options.resolve.plugins.push(
        new TsconfigPathsPlugin({
            configFile: './tsconfig.json',
        })
    );

    return options;
};
