import {ViewStream} from 'spyne';

/**
 * The quiet stand-in for the old blocking login modal: signed-out users get
 * the full editing experience and this one line telling them saving needs an
 * account. Hidden until the registry reports auth state, so it never flashes
 * at a user who is already signed in.
 */
export class CmsDataPanelSignedOutNotice extends ViewStream {

    constructor(props={}) {
        props.id = 'cms-data-signed-out-notice';
        props.class = 'cms-data-signed-out-notice';
        props.template = require('../templates/cms-data-panel-signed-out-notice.tmpl.html');
        super(props);
    }

    addActionListeners() {
        return [
          ["CHANNEL_AUTH_LOCAL_CONFIG_LOADED_EVENT", "onAuthStateLoaded"]
        ];
    }

    onAuthStateLoaded(e){
      const {user} = e.payload;
      const isSignedOut = user?.isAuthenticated !== true;

      this.props.el$.toggleClass('active', isSignedOut);
    }

    broadcastEvents() {
        return [];
    }

    onRendered() {
      this.addChannel("CHANNEL_AUTH_LOCAL");
    }

}
