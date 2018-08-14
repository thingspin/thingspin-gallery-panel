const baseWebpackConfig = require('./webpack.base');

var conf = baseWebpackConfig;
conf.devtool = "eval";
// conf.mode = 'production'; // cuz production wont work

module.exports = conf;