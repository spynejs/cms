import {ViewStream, ChannelPayloadFilter} from 'spyne';
import {MainPluginContentHolderView} from './main-plugin-content-holder-view';
import {SpynePluginCmsUITraits} from '../traits/spyne-plugin-json-cms-ui-traits';
import {CmsItemSelectBox} from './spyne-cms/cms-item-select-box';
import {CmsItemTextUpdater} from './spyne-cms/cms-item-text-updater';
import { AuthLocalTraits } from "../traits/auth-local-traits";
import { SpyneAppProperties } from 'spyne';

export class MainPluginView extends ViewStream {

  constructor(props = {}) {
    props.id = 'spyne-plugin-json-cms';
    props.traits = [SpynePluginCmsUITraits, AuthLocalTraits];
    props.dataset = {isCmsItem: 'true'};
    super(props);
  }

  addActionListeners() {

    const authPayloadFilter = new ChannelPayloadFilter({
      type: "auth0",
    });

    // return nexted array(s)
    return [
/*
      ["CHANNEL_UI_CLICK_EVENT", "authLocal$onUIEvent", authPayloadFilter],
*/
      ['CHANNEL_PLUGIN_JSON_CMS_PLUGIN_CHANGE_COLOR_THEME_EVENT', 'onChangeColorTheme'],
      ['CHANNEL_PLUGIN_JSON_CMS_PLUGIN_CORNER_PIN_EVENT', 'disableCmsMode'],
      ['CHANNEL_PLUGIN_CMS_CONFIG_EVENT', 'onInitState'],
      ['CHANNEL_PLUGIN_JSON_CMS_PLUGIN_MIN_MAX_CLOSE_EVENT', 'onMinMaxCloseEvent'],

    ];
  }

  toggleBodyCmsMode(bool=true){
    document.body.classList.toggle('spyne-plugin-cms-mode', bool);

  }



  disableCmsMode(){
    this.toggleBodyCmsMode(false);
  }

  onMinMaxCloseEvent(e) {
    const {payload} = e;
    const {isCmsMode} = payload;
    this.toggleBodyCmsMode(isCmsMode);

  }


  onInitState(e) {
    const {payload} = e;
    const {maximize} = payload;
    //console.log("ON INIT CMS PLUGIN STATE ",{maximize, payload, e})

    this.toggleBodyCmsMode(maximize);

  }

  toggleDarkMode(isDarkMode = true){

    const modeClass = isDarkMode ? 'dark' : 'light';
    this.props.el$.setClass(modeClass);
  }

  onChangeColorTheme(e){
    const {isDarkMode} = e.payload;
    this.toggleDarkMode(isDarkMode);
  }

  broadcastEvents() {
    // return nexted array(s)
    return [
/*
      ['#spyne-plugin-json-cms input', 'mouseup'],
*/
    ];
  }

  onRendered() {

    const {isCodemapBuild} = SpyneAppProperties;
    console.log('codemap build ', {isCodemapBuild})

    if (isCodemapBuild){
      return;
    }

    this.appendView(new CmsItemSelectBox());
    new CmsItemTextUpdater().appendToNull();
    const {config, pluginName} = this.props;
    this.appendView(new MainPluginContentHolderView({config, pluginName}));
    this.props.mainContentHolderEl$ = this.props.el$('#spyne-plugin-json-cms-content-holder');
    this.addChannel("CHANNEL_PLUGIN_CMS_CONFIG");
    this.addChannel('CHANNEL_PLUGIN_JSON_CMS_PLUGIN');
    this.addChannel("CHANNEL_UI");

    this.spyneCms$UpdatePosition(this.props.config.position, this.props.mainContentHolderEl$);
    const {darkMode} = config;
    this.toggleDarkMode(darkMode);
    this.props.mainContentHolderEl$.addClass('active');

  }

}
