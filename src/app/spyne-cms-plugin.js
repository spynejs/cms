// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
require("../scss/main-plugin.scss");

// ─────────────────────────────────────────────────────────────
// TinyMCE
// ─────────────────────────────────────────────────────────────
import tinymce from "tinymce";
import "tinymce/themes/silver/theme";
import "tinymce/icons/default";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/code";
import "tinymce/models/dom/model";

// ─────────────────────────────────────────────────────────────
// Spyne core
// ─────────────────────────────────────────────────────────────
import {
  SpynePlugin,
  SpyneApp,
  SpyneAppProperties,
  Channel,
  ChannelFetch,
} from "spyne";

// ─────────────────────────────────────────────────────────────
// Traits
// ─────────────────────────────────────────────────────────────
import { SpyneCmsProxyTraits } from "./internal/traits/spyne-cms-proxy-traits";
import { SpynePluginCmsUITraits } from "./internal/traits/spyne-plugin-json-cms-ui-traits";

// ─────────────────────────────────────────────────────────────
// Channels
// ─────────────────────────────────────────────────────────────
import { ChannelSpyneJSONCmsPlugin } from "./internal/channels/channel-spyne-json-cms-plugin";
import { ChannelSpyneJsonCmsData } from "./internal/channels/channel-spyne-json-cms-data";
import { ChannelSpyneJsonCmsDataUI } from "./internal/channels/channel-spyne-json-cms-data-ui";
import { ChannelDataPanels } from "./internal/channels/channel-data-panels";
import { ChannelCmsItems } from "./internal/channels/channel-cms-items";
import { ChannelTinymce } from "./internal/channels/channel-tinymce";
import { ChannelAuthLocal } from "./internal/channels/channel-auth-local";
import { ChannelModal } from "./internal/channels/channel-modal";

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────
import { SpyneCmsItem } from "./internal/components/spyne-cms/cms-custom-elements/spyne-cms-item";
import { SpyneCmsItemText } from "./internal/components/spyne-cms/cms-custom-elements/spyne-cms-item-text";
import { SpyneCmsItemHitbox } from "./internal/components/spyne-cms/cms-custom-elements/spyne-cms-item-hitbox";
import { MainPluginView } from "./internal/components/main-plugin-view";

// ─────────────────────────────────────────────────────────────
// CMS Plugin
// ─────────────────────────────────────────────────────────────
class SpyneCmsPlugin extends SpynePlugin {
  constructor(props = {}) {
    props.name = SpynePluginCmsUITraits.spyneCms$GetPluginName();
    props.requiredEvents = ["click", "mouseover", "mouseenter", "keyup", "keydown"];
    /**
     * OPTIONAL host enhancement (not required): declaring
     * SpyneCmsItem.connectedEventConfig in config.channels.WINDOW.customEvents
     * pre-materializes lazy panel sections per render burst and drives the
     * tab spinner. Without it, lazy sections materialize on first hover via
     * materializePathToCmsId — all core flows work either way.
     */
    super(props);
  }

  onBeforeRegistered() {
    SpyneApp.registerChannel(
      new Channel("CHANNEL_PLUGIN_CMS_CONFIG", {
        data: this.props.config,
        sendCachedPayload: true,
      }),
    );

    this.checkForRequiredWindowEvent();
  }

  defaultConfig() {
    return {
      pluginMethods: {
        mapCmsData: this.onMapCmsData.bind(this),
      },
      position: ["top", "right"],
      openOnLoad: true,
      darkMode: true,
      minimize: false,
      maximize: false,
      excludeChannels: [],
    };
  }

  onMapCmsData(
    data,
    metaData = { channelName: "CHANNEL_EMPTY", url: "http://localhost/empty/" },
  ) {
    const cmsData = SpyneCmsProxyTraits.spyneCms$MapData(data, metaData);
    this.props.mainEl.spyneCms$SendCMSChannelName(metaData.channelName);
    return cmsData;
  }

  onRegistered() {
    const { pluginName } = this.props;

    this.SpyneAppProperties.registerProxyReviver(
      SpyneCmsProxyTraits.spyneCms$ProxyName,
      SpyneCmsProxyTraits.spyneCms$CreateCmsProxyObjOrArr,
    );

    // self-healing bindings: lets DomElementTemplate resolve proxy-stripped
    // clones back to their live proxies via the __cms__id tombstone.
    // Guarded for spyne builds that predate the hydration hooks.
    if (typeof this.SpyneAppProperties.registerCmsRehydrator === "function") {
      this.SpyneAppProperties.registerCmsRehydrator(
        SpyneCmsProxyTraits.spyneCms$RehydrateByCmsId,
      );
    }

    SpyneApp.registerChannel(new ChannelSpyneJsonCmsDataUI());
    SpyneApp.registerChannel(new ChannelDataPanels());
    SpyneApp.registerChannel(
      new ChannelSpyneJSONCmsPlugin(undefined, { pluginName }),
    );
    SpyneApp.registerChannel(new ChannelSpyneJsonCmsData());
    SpyneApp.registerChannel(new ChannelCmsItems());
    SpyneApp.registerChannel(new ChannelTinymce());
    SpyneApp.registerChannel(new ChannelAuthLocal());
    SpyneApp.registerChannel(new ChannelModal());

    const getCMSPort = () => {
      let appDir;

      try {
        appDir = SPYNE_APP_DIR;
      } catch (e) {
        if (!window.location.origin.includes("8078")) {
          console.warn(
            "SPYNE_APP_DIR is missing.\nAdd this to webpack DefinePlugin:\nSPYNE_APP_DIR: JSON.stringify(process.cwd())",
          );
        }
        appDir = SPYNE_APP_DIR_TEST;
      }

      const cmsUrl = `http://localhost:52931/registry/lookup?dir=${appDir}`;

      SpyneApp.registerChannel(
        new ChannelFetch("CHANNEL_FETCH_REGISTRY_INFO", { url: cmsUrl }),
      );
    };

    requestAnimationFrame(getCMSPort);

    const excludeCMSChannels = [
      "CHANNEL_PLUGIN_JSON_CMS_PLUGIN",
      "CHANNEL_DATA_PANELS",
      "CHANNEL_PLUGIN_CMS_CONFIG",
            "CHANNEL_SPYNE_JSON_CMS_DATA_UI",
      "CHANNEL_AUTH_LOCAL",
      "CHANNEL_CMS_ITEMS",
      "CHANNEL_MODAL",
      "CHANNEL_TINYMCE",
      "CHANNEL_FETCH_REGISTRY_INFO"
    ];

    SpyneAppProperties.excludeChannelsFromConsole =
      window.location.origin.includes(":8078") ? [] : excludeCMSChannels;
  }

  createCustomElementCmsItem() {
    window.customElements.define("spyne-cms-item", SpyneCmsItem);
    window.customElements.define("spyne-cms-item-hitbox", SpyneCmsItemHitbox);
  }

  onRender() {
    this.createCustomElementCmsItem();

    const { config } = this.props;

    if (config.maximize === true) {
      config.position = ["bottom", "right"];
    }

    const { pluginName } = this;
    this.props.mainEl = new MainPluginView({ config, pluginName });
    this.props.mainEl.appendToDom(this.props.parentEl);
  }
}

export { SpyneCmsPlugin };
