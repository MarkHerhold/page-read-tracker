const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    target: 'web',
    module: {
        rules: [
            {
                test: /\.(j|t)s$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
