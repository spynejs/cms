import { Channel, ChannelPayloadFilter, SpyneAppProperties } from 'spyne';
import { AuthLocalTraits } from "../traits/auth-local-traits";
import { UtilTraits } from "../traits/util-traits";

export class ChannelAuthLocal extends Channel {
  constructor(name, props = {}) {
    name = 'CHANNEL_AUTH_LOCAL';
    props.traits = [AuthLocalTraits];
    props.sendCachedPayload = false;
    super(name, props);
  }

  onRegistered() {

   const registry$ = this.getChannel("CHANNEL_FETCH_REGISTRY_INFO")

    const routeFilter = new ChannelPayloadFilter({
      action: "CHANNEL_ROUTE_DEEPLINK_EVENT"
    })

   const route$ = this.getChannel("CHANNEL_ROUTE", routeFilter);


     this.mergeChannels([registry$, route$])
      .subscribe(this.onDeepLinkRegistry.bind(this));


    const uiAuthPayloadFilter = new ChannelPayloadFilter({
      payload: (pl) => pl.isGated !== undefined,
    });


   //console.log("auth local registered ");


    this.getChannel("CHANNEL_UI", uiAuthPayloadFilter).subscribe(
      this.authLocal$onUIEvent.bind(this),
    );

    /**
     * The publish button is the one gated action: signed-out users can edit
     * everything, but saving needs an account, so the login modal opens here
     * and nowhere else.
     * */
    const publishClickFilter = new ChannelPayloadFilter({
      payload: (pl) => pl.uiType === 'cms-data-panel-submit',
      action: "CHANNEL_UI_CLICK_EVENT"
    });

    this.getChannel("CHANNEL_UI", publishClickFilter).subscribe(
      this.onPublishAttempted.bind(this),
    );
  }

  onPublishAttempted(){
    if (this.props.isAuthenticated === true){
      return;
    }

    this.authLocal$OnModalRequest();
  }

  onToggleUpdate(e) {
    const { toggleState } = e.payload;
    const action = "CHANNEL_AUTH_LOCAL_TOGGLE_PROFILE_EVENT";
    this.sendChannelPayload(action, { toggleState });
  }


  onDeepLinkRegistry(e){
    const regEvt = e["CHANNEL_FETCH_REGISTRY_INFO"]
    this.onRegistryInfo(regEvt)

    const routeEvt = e["CHANNEL_ROUTE"];
    const {payload} = routeEvt;
    const {routeData} = payload;

    if (regEvt?.payload?.user?.isAuthenticated === true && SpyneAppProperties.enableCMSProxies ===false){
      const action = "CHANNEL_AUTH_LOCAL_SYNC_EVENT";
      this.sendChannelPayload(action, routeData);
    } else if (regEvt?.payload?.user?.isAuthenticated === false) {

      // TEMPORARY PREMIUM
      this.props.isPremium = true;
      this.props.isAuthenticated = false;

      /**
       * Signed-out users edit freely — the CMS stays quiet about auth until
       * they try to publish. The panel's signed-out notice tells them saving
       * needs an account; the modal only appears on the publish attempt.
       * */
    }


    //console.log("EVENT ROUTE ", {routeData, payload, routeEvt})

  }

  onRegistryInfo(e){

   //console.log('on reg ',e);

    const { payload } = e;
    const { user } = payload;
    const { isAuthenticated, role, edet } = user;

   //console.log("ON REG INFO ",{payload}, payload.user.name)

    if(SpyneAppProperties.enableCMSProxies === false){
      this.authLocal$AddEdetMethod(payload);
    }


    const isPremium = role === 'premium';
    const allowPremiumAccess = isAuthenticated === true && isPremium === true;

    this.props.isAuthenticated = isAuthenticated;
    this.props.isPremium = isPremium;
    this.props.user = user;


    SpyneAppProperties.setProp('user', user);
    SpyneAppProperties.setProp('isAuthenticated', isAuthenticated);
    SpyneAppProperties.setProp('isPremium', isPremium);

    /**
     *
     * TODO: ENABLE PREMIUM ACCESS FOR ALL USERS
     *
     * */

     SpyneAppProperties.setProp('allowPremiumAccess', true);

      // ================== DEFAULT CHECK DISABLED TO ALLOW FREE USERS PREMIUM ACCESS ==================
    //    SpyneAppProperties.setProp('allowPremiumAccess', allowPremiumAccess);
    // ===============================================================================================

   //console.log('local auth registered on info',e);


    const action = "CHANNEL_AUTH_LOCAL_CONFIG_LOADED_EVENT";

    this.sendChannelPayload(action, payload);

   //console.log("REGISTRY INFO ",e);

  }

  onCloseModal(e){
    const {payload} = e;
    const action =  "CHANNEL_AUTH_LOCAL_CLOSE_MODAL_EVENT";
    this.sendChannelPayload(action, payload);
  }


  addRegisteredActions() {
    return [
      "CHANNEL_AUTH_LOCAL_CONFIG_LOADED_EVENT",
      "CHANNEL_AUTH_LOCAL_SYNC_EVENT",
      "CHANNEL_AUTH_LOCAL_AUTHENTICATION_EVENT",
      "CHANNEL_AUTH_LOCAL_MODAL_OPEN_EVENT",
      "CHANNEL_AUTH_LOCAL_MODAL_CLOSE_EVENT",
      "CHANNEL_AUTH_LOCAL_MODAL_EVENT",
      ["CHANNEL_AUTH_LOCAL_MODAL_REQUEST_EVENT", "authLocal$OnModalRequest"],
      "CHANNEL_AUTH_LOCAL_WINDOW_REQUEST_EVENT",
      "CHANNEL_AUTH_LOCAL_AUTHENTICATION_EVENT",
      "CHANNEL_AUTH_LOCAL_APP_CREATE_REQUEST_EVENT",
      "CHANNEL_AUTH_LOCAL_APP_CREATE_GENERATING_EVENT",
      "CHANNEL_AUTH_LOCAL_APP_CREATE_COMPLETED_EVENT",
      "CHANNEL_AUTH_LOCAL_APP_LAUNCH_PREVIEW_WINDOW_EVENT",
      "CHANNEL_AUTH_LOCAL_CALLBACK_RESET_EVENT",
      "CHANNEL_AUTH_LOCAL_TOGGLE_PROFILE_EVENT",
      ["CHANNEL_AUTH_LOCAL_TOGGLE_REQUEST_EVENT", "onToggleUpdate"],
      "CHANNEL_AUTH_LOCAL_CLOSE_MODAL_EVENT",
      ["CHANNEL_AUTH_LOCAL_CLOSE_MODAL_REQUEST_EVENT","onCloseModal"]


    ];
  }

  onViewStreamInfo() {}
}
