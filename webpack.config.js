const webpack = require('vortex-api/bin/webpack').default;

const vortexWebpackConfig =
 webpack('cyberpunk2077', __dirname, 4);

const finalWebpackConfig = {
    ...vortexWebpackConfig,
    externals: {
        ...vortexWebpackConfig.externals,
        '@vortex-api-test-shimmed': 'vortex-api',
    },
    /*
    resolve: {
        ...vortexWebpackConfig.resolve,
        alias: {
            ...vortexWebpackConfig.resolve.alias,
            '@vortex-api-test-shimmed': 'vortex-api',
        },
    },
    */
};

console.log(vortexWebpackConfig, finalWebpackConfig);

module.exports = finalWebpackConfig;