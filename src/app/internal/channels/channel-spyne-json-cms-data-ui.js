import {Subject} from 'rxjs';
import {Channel, ChannelPayloadFilter} from 'spyne';
import {SpyneCmsPanelDataTraits} from '../traits/spyne-cms-panel-data-traits';
import {is, all,__, map, compose, uniq} from 'ramda';


export class ChannelSpyneJsonCmsDataUI extends Channel{

  constructor(name, props={}) {
    name="CHANNEL_SPYNE_JSON_CMS_DATA_UI";
    props.sendCachedPayload = false;
    props.traits = SpyneCmsPanelDataTraits;
    props.dataStateMachine = SpyneCmsPanelDataTraits.spyneCmsPanelData$CreateDataStateMachine();
    props.dataPanelChangedArr = [];
    props.submittedDataPanelsArr = [];

    /**
     *
     * TODO: ADD SMART CHECK FOR MOVE, DELETE AND DUPLICATE METHODS
     *
     * */


    super(name, props);
  }

  sendItemFocusedEvent(payload, srcElement={}){
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_UI_FOCUS_EVENT";
    this.sendChannelPayload(action, payload, srcElement);

  }

  onDataPanelUiItemClicked(e){
    const {payload} = e;
    const {type, uiType} = payload;

    const defaultFn = ()=>console.log(`the following cms data ui item, ${uiType}, does not have a method`);

    const uiTypeMethodHash = {
      "cms-data-panel-tab" : ()=>this.onDataPanelTabClicked(e),
      "cms-data-panel-submit" : ()=>this.onDataPanelSubmitUpdates(e)

    }


    const fn = uiTypeMethodHash[uiType] || defaultFn;

     fn();

  }

  onDataPanelSubmitUpdates(e){

    const {dataPanelChangedArr} = this.props;
    const {rootProxyIds} = this.props.dataStateMachine;
    const submitPanelIdsArr =  uniq(dataPanelChangedArr.concat(rootProxyIds));
    this.props.dataPanelChangedArr = submitPanelIdsArr
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_UI_SUBMIT_DATA_EVENT";

    this.sendChannelPayload(action, {submitPanelIdsArr})

   // console.log('submit updates ',{submitPanelIdsArr, rootProxyIds, dataPanelChangedArr});


  }


  onDataPanelTabClicked(e){
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_UI_PANEL_FOCUS_EVENT";
    const {payload} = e;

    //console.log("PANEL TAB CLICKED ",e);

    this.sendChannelPayload(action, payload);
  }


  onSpyneCmsItemFocused(e){
    let {payload, srcElement} = e;
    const {cmsId, cmsKey} = payload;
    const isValidFocusEvent = this.spyneCmsPanelData$HasCmsValues(cmsId, cmsKey);

    if (isValidFocusEvent === true){
      const rootId = cmsId.replace(/^(cms-\d{8}-)(.*)$/g, "$1")

      payload = Object.assign({rootId}, payload);
      this.sendItemFocusedEvent(payload, srcElement);
    }
    //console.log("CMS ID AND PAYLOAD IS ",{cmsId,isValidFocusEvent, cmsKey, payload})

  }

  /**
   * TODO: Listen for type change event and adjust input to reflect different type
   *
   * */

  onDataPropValueChanged(e){
    const {payload} = e;
    const {cmsId, cmsKey, isKey} = payload;

    const isValidFocusEvent = this.spyneCmsPanelData$HasCmsValues(cmsId, cmsKey);

    //console.log("UI INPUT EVENT ",{cmsId, cmsKey, isKey, payload})

    if (isValidFocusEvent === true){
      const {event} = e;
      const {target} = event;
      const {value} = target
      const isKeyChangedBool = isKey === "true" && value!==undefined ? value !== cmsKey : -1;
      //console.log("VALUE FROM INPUT IS ",{value,cmsKey, isKey,isKeyChangedBool, target, event, payload});
      const action = "CHANNEL_SPYNE_JSON_CMS_DATA_UI_INPUT_CHANGED_EVENT";
      const textVal =  value;//String(value).replace("\n", "<br /> \n \r\n");
      this.sendChannelPayload(action, {cmsKey, isKey,isKeyChangedBool, cmsId, textVal})

    }


  }

  onRegistered(){

    const inputChangeFilter = new ChannelPayloadFilter({selector:'.cms-panel-input', action:"CHANNEL_UI_KEYUP_EVENT"});
    this.getChannel("CHANNEL_UI", inputChangeFilter)
        .subscribe(this.onDataPropValueChanged.bind(this));


    const spyneCmsItemHitboxFilter = new ChannelPayloadFilter({selector:'spyne-cms-item-hitbox'})

      this.getChannel("CHANNEL_UI", spyneCmsItemHitboxFilter)
          .subscribe(this.onSpyneCmsItemFocused.bind(this));

      //selector: ['.cms-data-panel-tab', "#cms-data-publish-btn"],

    const onDataPanelTabClickedFilter = new ChannelPayloadFilter({
      payload: v => v.type === 'cms-data-panel-active-ui',
      action: "CHANNEL_UI_CLICK_EVENT"});

    this.getChannel("CHANNEL_UI", onDataPanelTabClickedFilter)
        .subscribe(this.onDataPanelUiItemClicked.bind(this))


  }

  onPanelChangedEvent(e){



    const {payload} = e;
    const {rootProxyId} = payload;
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_UI_DATA_STATE_CHANGED_EVENT";
    const dataHasUpdated = true;
    const dataStateChanged = true;
    const isPersistentChange = true;
    const newPayload = {rootProxyId, dataHasUpdated, dataStateChanged, isPersistentChange};


    if (this.props.dataPanelChangedArr.length<=0){
      this.sendChannelPayload(action, newPayload);
    }

    this.props.dataPanelChangedArr.push(rootProxyId);
   // console.log("PANEL CHANGED ARR IS ",{newPayload, payload},this.props.dataPanelChangedArr);
    //document.querySelector(`.cms-data-panel.${rootProxyId}`)

  }


  onCmsDataPropertyChanged(e){


    const {payload,srcElement} = e;
    const {valChanged, isKey} = payload;
    const {vsid} = srcElement;
    //isKey = String(isKey) === "true";

    this.props.dataStateMachine.update(valChanged, vsid, isKey);
    const {dataHasUpdated, dataStateChanged, elements} = this.props.dataStateMachine;


    if (dataStateChanged===true && this.props.dataPanelChangedArr.length<=0){
      const action = "CHANNEL_SPYNE_JSON_CMS_DATA_UI_DATA_STATE_CHANGED_EVENT";
      this.sendChannelPayload(action, {dataHasUpdated, dataStateChanged, elements});
    }

   // console.log('changed payload is ',{isKey,valChanged,rootProxyIds, vsid, dataHasUpdated, dataStateChanged: dataStateChanged, elements, payload})

  }

  addRegisteredActions() {

    return [
      "CHANNEL_SPYNE_JSON_CMS_DATA_UI_DATA_STATE_CHANGED_EVENT",
      ["CHANNEL_SPYNE_JSON_CMS_DATA_UI_PANEL_PERSISTENT_CHANGE_EVENT", "onPanelChangedEvent"],
      ["CHANNEL_SPYNE_JSON_CMS_DATA_UI_DATA_UPDATE_CHANGED_EVENT", "onCmsDataPropertyChanged"],
      "CHANNEL_SPYNE_JSON_CMS_DATA_UI_SUBMIT_DATA_EVENT",
      "CHANNEL_SPYNE_JSON_CMS_DATA_UI_FOCUS_EVENT",
      "CHANNEL_SPYNE_JSON_CMS_DATA_UI_PANEL_FOCUS_EVENT",
      "CHANNEL_SPYNE_JSON_CMS_DATA_UI_INPUT_CHANGED_EVENT"
    ];
  }

  onViewStreamInfo(obj) {
    let data = obj.props();
  }

}

