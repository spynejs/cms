import {ViewStream, DomElement, SpyneAppProperties} from 'spyne';
import {CmsDataPanelPublishBtn} from './cms-data-panel-publish-btn';
import {CmsDataPanelSignedOutNotice} from './cms-data-panel-signed-out-notice';
const archiveBtnTmpl = require('./templates/cms-data-panel-backups-btn.tmpl.html');
import { TinymceHolder } from "../tinymce/tinymce-holder";
import {
  CMS_UI_ControlsResyncBtn
} from "../../main-plugin-ui/cms-ui-controls-resync-btn";

export class CmsDataPanelUI extends ViewStream {

    constructor(props={}) {
        props.id = 'cms-data-panel-ui';
        props.channels = ["CHANNEL_AUTH_LOCAL"];
        props.template = require('../templates/cms-data-panel-ui.tmpl.html');
        super(props);
    }

    addActionListeners() {
        // return nexted array(s)
        return [
            ["CHANNEL_AUTH_LOCAL_SYNC_EVENT", "onLoadSyncButton"],
            ["CHANNEL_PLUGIN_CMS_CONFIG_EVENT", "onConfigEvent"],
            ["CHANNEL_PLUGIN_JSON_CMS_PLUGIN_MIN_MAX_CLOSE_EVENT", "onMinClose"],
            ["CHANNEL_AUTH_LOCAL_CONFIG_LOADED_EVENT", "updateArchiveBtnPort"]
        ];
    }

  onLoadSyncButton(e){
    const {payload} = e;
   //console.log("LOAD SYNC BTN ",e);
    this.appendView(new CMS_UI_ControlsResyncBtn({data:payload}), '.ui-holder-bottom');
  }


  onConfigEvent(e){
      const {payload} = e;
      const {maximize} = payload;
      const hideBtnsBool = String(maximize) !== "true";

      this.props.el$.toggleClass('hide', hideBtnsBool);

    }

    onMinClose(e){
       const {pluginJsonCmsResizeType} = e.payload;

       const hideBtnsBool = pluginJsonCmsResizeType === 'close';

       this.props.el$.toggleClass('hide', hideBtnsBool);



    }

    broadcastEvents() {
        // return nexted array(s)
        return [];
    }

    updateArchiveBtnPort(e){

      const {payload} = e;
      const {cms} = payload;
      const {port} = cms;

     //console.log("ALL IS ",{cms, port, payload, e});

      SpyneAppProperties.setProp("CMS_PORT", port);
      this.props.el$("#cms-data-backups-btn").el.href = `//localhost:${port}`

    }

    onRendered() {
      this.appendView(new CmsDataPanelPublishBtn(), '.ui-holder-bottom');

      const archiveBtn = new DomElement({
        template:archiveBtnTmpl

      })



      this.props.el$('.ui-holder-bottom').el.appendChild(archiveBtn.render());

      // sits after the actions — secondary to them, and only visible signed out
      this.appendView(new CmsDataPanelSignedOutNotice(), '.ui-holder-bottom');

     // window.setTimeout(this.updateArchiveBtnPort.bind(this), 1000);

      this.addChannel("CHANNEL_PLUGIN_JSON_CMS_PLUGIN");
      this.addChannel("CHANNEL_PLUGIN_CMS_CONFIG");
      this.addChannel("CHANNEL_AUTH_LOCAL");

      this.appendView(new TinymceHolder(), ".ui-holder-top");
    }

}

