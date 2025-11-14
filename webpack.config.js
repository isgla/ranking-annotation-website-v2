const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");

module.exports = {
    entry: path.join(__dirname, "src", "webpack-index.jsx"),
    output: {
        path: path.resolve(__dirname, "dist"),
    },
    module: {
        rules: [
            {
                test: /\.?jsx$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            "./src/presets/literal-transfer.js", // This make sure that literal transfer happens after react transfer.
                            '@babel/preset-env',
                            ['@babel/preset-react', {"runtime": "automatic"}]
                        ],
                    }
                }
            },
            {   
                // Transfer js files to remove literals
                test: /\.js$/,
                use: {loader: "babel-loader", options: {presets: ["./src/presets/literal-transfer.js"]}}
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts']
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            scriptLoading: "blocking",
            template: path.join(__dirname, "src", "webpack-index.html"),
        }),
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/.js, /.css]),
    ]
}