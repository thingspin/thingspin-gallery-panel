const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

function resolve(dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  target: 'node',
  context: resolve('src'),
  entry:{
    'module.js' : './module.ts',
  },
  output: {
    path: resolve('dist'),
    filename: "[name]",
    chunkFilename: '[name].bundle.js',
    libraryTarget: "amd"
  },
  externals: [
    function (context, request, callback) {
      var prefix = 'grafana/';
      if (request.indexOf(prefix) === 0) {
        return callback(null, request.substr(prefix.length));
      }
      callback();
    }
  ],
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CopyWebpackPlugin([
      { from: '**/*.json' },
      { from: 'img/**' },
      { from: '**/*.css' },
      { from: '**/*.svg' },
      { from: '**/*.html' },
      { from: '**/*.eot' },
      { from: '**/*.woff' },
      { from: '**/*.woff2' },
      { from: '**/*.ttf' },
    ]),
    new webpack.ContextReplacementPlugin(
      /\@angular(\\|\/)core(\\|\/)fesm5/,
      path.resolve(__dirname, ".")
    ),
  ],
  resolve: {
    extensions: [".ts", ".js", ".scss"]
  },
  module: {
    rules: [
      {
        test: /\.(html|svg)$/,
        exclude: /node_modules/,
        use: { loader: 'html-loader' },
      },
      {
        test: /\.tsx?$/,
        loaders: ["ts-loader"],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        include: [/node_modules/],
      },
      {
        test: /\.css$/,
        loaders: ['to-string-loader', 'css-loader'],
        exclude: [/node_modules/] //add this line so we ignore css coming from node_modules
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        loaders: ['raw-loader', 'sass-loader'] // sass-loader not scss-loader
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
            loader: 'file-loader',
            options: {
                name: '[name].[ext]',
                outputPath: 'fonts/'
            }
        }]
      }
    ]
  }
}
