const baseWebpackConfig = require('./webpack.base');

var conf = baseWebpackConfig;
conf.devtool = "eval";
// conf.watch = true;
conf.mode = 'development';

module.exports = conf;