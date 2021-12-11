// vim: sts=2:ts=2:sw=2
import {merge} from 'webpack-merge';
import {configMain, configMainProd} from './webpack.common.main.js';

export default [
  merge(
    configMain,
    configMainProd,
  )
];
