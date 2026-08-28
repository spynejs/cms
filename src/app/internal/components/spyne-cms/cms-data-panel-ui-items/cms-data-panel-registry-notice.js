import {ViewStream} from 'spyne';

/**
 * Shown when the registry lookup returns no cms server entry for this app —
 * a stale or reset registry, or an app that has not registered yet. Publish
 * cannot reach a server in that state, so instead of failing silently the
 * panel says what happened and the usual remedy: restarting the app
 * re-registers it with the registry at localhost:52931.
 */
export class CmsDataPanelRegistryNotice extends ViewStream {

    constructor(props={}) {
        props.id = 'cms-data-registry-notice';
        props.class = 'cms-data-panel-notice cms-data-registry-notice';
        props.template = require('../templates/cms-data-panel-registry-notice.tmpl.html');
        super(props);
    }

    addActionListeners() {
        return [
          ["CHANNEL_AUTH_LOCAL_CONFIG_LOADED_EVENT", "onRegistryInfoLoaded"]
        ];
    }

    onRegistryInfoLoaded(e){
      const port = e.payload?.cms?.port;

      this.props.el$.toggleClass('active', port === undefined);
    }

    broadcastEvents() {
        return [];
    }

    onRendered() {
      this.addChannel("CHANNEL_AUTH_LOCAL");
    }

}
