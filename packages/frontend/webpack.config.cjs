const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[contenthash:8].js',
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.md'],
      alias: {
        '@docs': path.resolve(__dirname, '../../docs'),
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          oneOf: [
            {
              test: /\.module\.css$/,
              use: [
                'style-loader',
                {
                  loader: 'css-loader',
                  options: {
                    modules: {
                      namedExport: false,
                      localIdentName: isDev
                        ? '[name]__[local]--[hash:base64:5]'
                        : '[hash:base64:8]',
                    },
                  },
                },
              ],
            },
            {
              use: ['style-loader', 'css-loader'],
            },
          ],
        },
        {
          test: /\.md$/,
          type: 'asset/source',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
    ],
    devServer: {
      port: 3000,
      hot: true,
      open: false,
      historyApiFallback: true,
      allowedHosts: 'all',
      proxy: [
        {
          context: ['/api', '/ws/chat'],
          target: 'http://localhost:8080',
          ws: true,
        },
      ],
    },
    devtool: isDev ? 'eval-source-map' : 'source-map',
  };
};
