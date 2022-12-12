const path = require("path");
const nodeExternals = require("webpack-node-externals");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// const NodemonPlugin = require("nodemon-webpack-plugin");
const Dotenv = require("dotenv-webpack");

const CURRENT_WORKING_DIR = process.cwd();

const res = (p) => path.resolve(CURRENT_WORKING_DIR, p);
const entry = res(process.env.SCRIPT);
const output = res("public");

module.exports = {
  name: "server",
  target: "node",
  mode: "development",
  externals: [nodeExternals()],
  entry: [entry],
  output: {
    path: output,
    publicPath: "/",
  },
  devtool: "eval",
  plugins: [
    new CleanWebpackPlugin(),
    // new NodemonPlugin({ verbose: true }),
    new Dotenv(),
  ],
};
