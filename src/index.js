// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
require("./scss/main.scss");

// ─────────────────────────────────────────────────────────────
// Spyne core
// ─────────────────────────────────────────────────────────────
const { SpyneApp, ChannelFetch } = require("spyne");

// ─────────────────────────────────────────────────────────────
// Plugins
// ─────────────────────────────────────────────────────────────
import { SpynePluginConsole } from "spyne-plugin-console";
import { SpyneCmsPlugin } from "./app/spyne-cms-plugin";

// ─────────────────────────────────────────────────────────────
// App data
// ─────────────────────────────────────────────────────────────
import PlaceholderAppData from "./static/data/placeholder-app-data.json";
import NestedTestData from "data/nested-test-data.json";

// ─────────────────────────────────────────────────────────────
// Views
// ─────────────────────────────────────────────────────────────
import { StageView } from "./app/internal/components/placeholder-app/stage-view";

// ─────────────────────────────────────────────────────────────
// Channels
// ─────────────────────────────────────────────────────────────
import { ChannelPlaceholderCombinedData } from "./app/internal/channels/channel-placeholder-combined-data.js";

// ─────────────────────────────────────────────────────────────
// Utilities (dev only)
// ─────────────────────────────────────────────────────────────
const R = require("ramda");
window.R = R;

// ─────────────────────────────────────────────────────────────
// Spyne app configuration
// ─────────────────────────────────────────────────────────────
const config = {
  appGenMode: false,
  mode: 'app',
  strict: false,
  debug: true,

  channels: {
    WINDOW: {
      listenForScroll: true,
      listenForOrientation: true,
      debounceMSTimeForScroll: 50,
      events: ["click", "mouseover", "mouseenter", "keyup", "keydown"],
    },

    ROUTE: {
      type: "slash",
      isHash: false,
      isHidden: false,
      add404s: true,
      routes: {
        routePath: {
          404: ".+",
          routeName: "pageId",
          home: "^$",
          "page-one": {
            routePath: {
              404: ".+",
              routeName: "cardId",
              "card-1": "card-1",
              "card-2": "card-2",
              "card-3": "card-3",
            },
          },
          "page-two": "page-two",
          "page-three": "page-three",
        },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// CMS plugin configuration (dev only)
// ─────────────────────────────────────────────────────────────
const cmsPluginConfig = {
  position: ["bottom", "right"],
  openOnLoad: true,
  darkMode: true,
  maximize: true,
};

// ─────────────────────────────────────────────────────────────
// Initialize Spyne
// ─────────────────────────────────────────────────────────────
SpyneApp.init(config);

// ─────────────────────────────────────────────────────────────
// Dev-only plugins
// ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  SpyneApp.registerPlugin(new SpyneCmsPlugin(cmsPluginConfig));
  SpyneApp.registerPlugin(
    new SpynePluginConsole({ position: ["bottom", "left"], minimize: true }),
  );
}

// ─────────────────────────────────────────────────────────────
// Data mapping (CMS-aware in dev)
// ─────────────────────────────────────────────────────────────
const mapFn =
  process.env.NODE_ENV === "development"
    ? SpyneApp.pluginsFn.mapCmsData
    : (v) => v;

// ─────────────────────────────────────────────────────────────
// Channels
// ─────────────────────────────────────────────────────────────
SpyneApp.registerChannel(new ChannelPlaceholderCombinedData());

// ─────────────────────────────────────────────────────────────
// App bootstrap
// ─────────────────────────────────────────────────────────────
const loadStage = () => {
  SpyneApp.registerChannel(
    new ChannelFetch("CHANNEL_NESTED_TEST_APP_DATA", {
      url: NestedTestData,
      map: mapFn,
    }),
  );

  SpyneApp.registerChannel(
    new ChannelFetch("CHANNEL_FETCH_PLACEHOLDER_APP_DATA", {
      url: PlaceholderAppData,
      map: mapFn,
    }),
  );

  new StageView().appendToDom(document.body);
};

loadStage();
