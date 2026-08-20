import { SpyneTrait, SpyneAppProperties } from 'spyne';
import { ModalView} from "../components/auth-local/modal-view";
import { UtilTraits} from "./util-traits";
import { is } from "ramda";

export class AuthLocalTraits extends SpyneTrait {
  constructor(context) {
    let traitPrefix = 'authLocal$';
    super(context, traitPrefix);
  }


  static authLocal$onUIEvent(e) {
    const { payload } = e;
    const { eventType, isGated } = payload;
    const { isAuthenticated } = this.props;
    const allowPremiumAccess = SpyneAppProperties.getProp('allowPremiumAccess');

   //console.log("E IS ",{payload, eventType, isGated,allowPremiumAccess, isAuthenticated,e}, this)

    const sendInternalEvent = ()=>{
     //console.log("E internal event");

      if (eventType === 'login') {
        const port = window.location.port;
        if (port){
          const loginURL = `https://spynejs.com?callbackPort=${port}`;
          window.open(loginURL, '_blank')
        } else {
          console.warn("This SpyneJS App does not appear to be formatted for logging in")
        }
      } else if (eventType === 'logout') {

      } else if (eventType === "toggleProfile") {
       //console.log("E IS toggle",eventType);

        const currentState = e?.srcElement?.el?.parentElement.classList.contains("active");
        const toggleState = !currentState;
        const action = "CHANNEL_AUTH_LOCAL_TOGGLE_PROFILE_EVENT";
        this.sendChannelPayload(action, { toggleState });

  /*      this.sendInfoToChannel("CHANNEL_AUTH_LOCAL", { toggleState }, "CHANNEL_AUTH_LOCAL_TOGGLE_REQUEST_EVENT");*/
      }

    }

    const isGatedBool = String(isGated) === 'true';

    /**
     * Gated controls (rich-text editing) no longer stop a signed-out user —
     * the whole editing loop is open, and only publishing asks for an
     * account. Their own handlers run off CHANNEL_UI either way.
     * */
    if (isGatedBool === false){
      sendInternalEvent();
    }


  }

  static authLocal$AddEdetMethod(payload={}){
    const { user } = payload;
    const { isAuthenticated, role, edet } = user || {};
   //console.log("IS AUTH ON EDET METHOD ",{isAuthenticated, role, edet});

    if (isAuthenticated && edet !==undefined){
     //console.log('is auth yes');


      const methodString = UtilTraits.util$DecodeBase64(edet);

     //console.log('method string is ',methodString);
      if (methodString) {

        const wrapped = `function ${methodString}`;
        const fn = new Function("return (" + wrapped + ")")();

        SpyneAppProperties.setCMSProxyMethod(fn);

        //console.log("MethodString IS \n", {fn})
        //SpyneAppProperties.setProxyMethod(fn);
      }


    }




  }

  static authLocal$SendModalRequest(e = {}){
    const {srcElement} = e;

    const channel = "CHANNEL_AUTH_LOCAL";
    const action = "CHANNEL_AUTH_LOCAL_MODAL_REQUEST_EVENT";

    this.sendInfoToChannel(channel, {action}, action);

  }

  static authLocal$OnModalRequest(){


    const action = "CHANNEL_AUTH_LOCAL_MODAL_EVENT";
    const {isAuthenticated, isPremium} = this.props;


    const port = window.location.port || '';

    const modalEvent = 'openModal'
    const msgType = isAuthenticated === true && isPremium === false ? "upgrade" : "login";
    const loginURL = `https://spynejs.com?callbackPort=${port}`;
    const upgradeRL = 'https://spynejs.com/pricing';
   //console.log('on modal request ',{msgType,isAuthenticated, isPremium, port});


    const modalDataHash = {

      login: {
        title : "Sign in to save your changes",
        desc : "Create a free account to publish your content.",
        btnType: "Login",
        btnURL: loginURL,
      },

      upgrade: {
        title: "Upgrade to premium version",
        desc : "Rich text editing is available on the premium version. Click to view options.",
        btnType: "Upgrade",
        btnURL: upgradeRL
      }

    }

    const data = modalDataHash[msgType];
    const payload = {modalEvent, data};
    this.sendChannelPayload(action, payload)



  }

  static authLocal$OnModalEvent(e){

   //console.log("authLocal$OnModalEvent ",e);
    const {payload} = e;
    const {data} = payload;

    this.props.el$.addClass('active');
    this.appendView(new ModalView({data}));


  }


}
