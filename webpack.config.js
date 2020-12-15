const path = require('path');

module.exports = {
  // モードの設定、v4系以降はmodeを指定しないと、webpack実行時に警告が出る
  mode: 'development',
  // エントリーポイントの設定
  entry: `${__dirname}/src/js/app.js`,
  // 出力の設定
  output: {
    filename: 'main.js',
    path: path.join(__dirname, '/docs/js')
  }
};
