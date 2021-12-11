// vim: sts=2:ts=2:sw=2

import path from 'path';
import url from 'url';
import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin';
import webpack from 'webpack';

const {DefinePlugin/*, SourceMapDevToolPlugin */} = webpack;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const configMain = {
  entry: {
    main: {
      import: './js/main.js',
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  'targets': {
                    'chrome': '58', // TODO
                  }
                }
              ],
              '@babel/preset-react'
            ],
            plugins: [
              '@babel/plugin-transform-react-jsx',
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-runtime',
            ],
            include: [
              path.resolve('js'),
            ]
          }
        }
      },
      {
        test: /\.(scss|css)$/,
        use: [
          {
            loader: 'style-loader',
            options: {
              insert: 'head', // insert style tag inside of <head>
              injectType: 'singletonStyleTag' // this is for wrap all your style in just one style tag
            },
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              webpackImporter: true,
              additionalData: '$version: "' + process.env.PACKAGE_VERSION + '";', // needs sass-loader >= 5.0.0
            },
          },
        ],
      },
    ]
  },
  devServer: {
    static: {
      publicPath: '/',
      directory: 'dist', // this is always relative to the main project dir
      watch: true,
    },
    devMiddleware: {
      //writeToDisk: true,
    },
    port: 7998,
    liveReload: false,
    client: false,
    compress: true,
  },
  plugins: [
    new DefinePlugin({
      'process.env.PACKAGE_VERSION': JSON.stringify(process.env.PACKAGE_VERSION),
      'process.env.PACKAGE_NAME': JSON.stringify(process.env.PACKAGE_NAME),
      'process.env.NODE_DEBUG': JSON.stringify(process.env.NODE_DEBUG),
      'process.env.DEBUG': JSON.stringify(process.env.DEBUG)
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'template/index.html'
    }),
    new HtmlInlineScriptPlugin(),
  ],
};

const configMainDev = {
  mode: 'development',
  plugins: [
    //new SourceMapDevToolPlugin({
    //  'filename': process.env.PACKAGE_NAME + '.bundle-' + process.env.PACKAGE_VERSION + '-[fullhash].min.js.map',
    //  'append': null,
    //  'module': true,
    //  'columns': true,
    //  'noSources': false,
    //  'namespace': ''
    //}),
  ],
};

const configMainProd = {
  mode: 'production',
};

export {
  configMain,
  configMainDev,
  configMainProd,
};
