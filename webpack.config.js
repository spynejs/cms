import path from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { CmsAdapterWebpack } from "@spynejs/cms-adapter";


// -------------------------------------------------------------------
// ESM __dirname replacement
// -------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// -------------------------------------------------------------------
// MAIN CONFIG EXPORT
// -------------------------------------------------------------------
export default (env = {}, argv = {}) => {
  const mode = argv.mode || "development";
  const isProduction = mode === "production";
  const isTestMode = mode === "none";

  const RELATIVE_ROOT = "./";
  const DEFAULT_ASSETS_DIR = "assets";

  const publicPath = isProduction ? RELATIVE_ROOT : "/";
  const assetsFolder = isProduction ? `${DEFAULT_ASSETS_DIR}/` : "";
  const imgPath = `${publicPath}${assetsFolder}static/imgs/`;

  const port = process.env.PORT || 8078;

  // -------------------------------------------------------------------
  // ENTRY + OUTPUT
  // -------------------------------------------------------------------
  const entryFile = isProduction
    ? "./src/app/spyne-cms-plugin.js"
    : "./src/index.js";

  const libraryName = "spyne-cms-plugin";

  // -------------------------------------------------------------------
  // EXTERNALS
  // -------------------------------------------------------------------
  const externals = isProduction
    ? [
      {
        gsap: {
          commonjs: "gsap",
          commonjs2: "gsap",
          amd: "gsap",
          root: "gsap",
        },
      },
      {
        tinymce: {
          commonjs: "tinymce",
          commonjs2: "tinymce",
          amd: "tinymce",
          root: "tinymce",
        },
      },
      {
        spyne: {
          commonjs: "spyne",
          commonjs2: "spyne",
          amd: "spyne",
          root: "spyne",
        },
      },
    ]
    : [];

  // -------------------------------------------------------------------
  // OPTIMIZATION
  // -------------------------------------------------------------------
  const optimization = isProduction
    ? { splitChunks: false, runtimeChunk: false }
    : {
      splitChunks: {
        cacheGroups: {
          common: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendor",
            chunks: "all",
          },
        },
      },
    };

  // -------------------------------------------------------------------
  // PLUGINS
  // -------------------------------------------------------------------
  const plugins = [
    new webpack.DefinePlugin({
      IMG_PATH: JSON.stringify(imgPath),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      SPYNE_APP_DIR_TEST: JSON.stringify(process.cwd()),
    }),
  ];

  if (isProduction) {
    plugins.push(
      new MiniCssExtractPlugin({
        filename: `${assetsFolder}/css/main.css`,
      })
    );
  } else if (isTestMode) {
    plugins.push(
      new HtmlWebpackPlugin({
        template: "./src/index.tmpl.html",
        minify: false,
      })
    );
  } else {
    plugins.push(
      new HtmlWebpackPlugin({
        template: "./src/index.tmpl.html",
        minify: false,
      }),
      new CmsAdapterWebpack()
    );
  }

  // -------------------------------------------------------------------
  // MODULE RULES
  // -------------------------------------------------------------------
  const rules = [
    {
      test: /\.html$/,
      loader: "html-loader",
      options: { minimize: false, esModule: false },
    },
    {
      test: /\.(sa|sc|c)ss$/,
      use: [
        "style-loader",
        "css-loader",
        { loader: "sass-loader", options: { sourceMap: !isProduction } },
      ],
    },
    {
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: "asset",
    },
    {
      test: /\.json$/,
      type: "javascript/auto",
      use: [
        {
          loader: "file-loader",
          options: {
            name: `${assetsFolder}static/data/[name].[ext]`,
          },
        },
      ],
    },
  ];

  // -------------------------------------------------------------------
  // RESOLVE
  // -------------------------------------------------------------------
  const resolve = {
    alias: {
      // Pin dev builds to the local spyne so every importer shares ONE
      // SpyneApp instance — npm install silently replaces the
      // node_modules/spyne link with the registry copy, which otherwise
      // bundles a second (uninitialized) SpyneApp. Production builds are
      // unaffected: spyne is externalized there by request string.
      spyne$: path.resolve(__dirname, "../spyne-private"),
      plugins: path.resolve(__dirname, "src/plugins/"),
      imgs: path.resolve(__dirname, "src/static/imgs/"),
      fonts: path.resolve(__dirname, "src/static/fonts/"),
      data: path.resolve(__dirname, "src/static/data/"),
      css: path.resolve(__dirname, "src/css/"),
      core: path.resolve(__dirname, "src/core/"),
      traits: path.resolve(__dirname, "src/app/traits/"),
      channels: path.resolve(__dirname, "src/app/channels/"),
      components: path.resolve(__dirname, "src/app/components/"),
      node_modules: path.resolve(__dirname, "node_modules/"),
      tinymce: path.resolve(__dirname, "node_modules/tinymce"),
    },
    extensions: [".js", ".css"],
  };

  // -------------------------------------------------------------------
  // DEV SERVER
  // -------------------------------------------------------------------
  const devServer = {
    static: [{ directory: path.join(__dirname, "src") }],
    historyApiFallback: true,
    devMiddleware: { publicPath: "/" },
    port,
  };

  // -------------------------------------------------------------------
  // FINAL CONFIG
  // -------------------------------------------------------------------
  return {
    mode,
    stats: isProduction ? "none" : {
      loggingDebug: ['sass-loader'],
      warningsFilter: [/sass-loader/, /Deprecation Warning/],
    },
    entry: entryFile,
    externals,
    output: {
      filename: isProduction
        ? `${libraryName}.min.js`
        : "public/js/[name].js",
      path: path.resolve(__dirname, "lib"),
      clean: true,
      publicPath: "/",
      library: { name: libraryName, type: "umd" },
    },
    watchOptions: { aggregateTimeout: 200, poll: 1000 },
    devtool: isProduction ? false : "inline-source-map",
    devServer,
    plugins,
    optimization,
    module: { rules },
    resolve,
  };
};
