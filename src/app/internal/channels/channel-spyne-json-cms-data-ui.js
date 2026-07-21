import {Subject} from 'rxjs';
import {Channel, ChannelPayloadFilter} from 'spyne';
import {SpyneCmsPanelDataTraits} from '../traits/spyne-cms-panel-data-traits';
import {is, all,__, map, compose, uniq} from 'ramda';


export class ChannelSpyneJsonCmsDataUI extends Channel{

  constructor(name, props={}) {
    name="CHANNEL_SPYNE_JSON_CMS_DATA_UI";
    props.sendCachedPayload = false;
    props.traits = SpyneCmsPanelDataTraits;
    // per-panel publish state: rootProxyId -> dataHasUpdated, reported by
    // each CmsDataPanel from its baseline-hash comparison
    props.changedPanelsMap = {};
    props.aggregateChanged = undefined;
    props.submittedDataPanelsArr = [];


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

    // only panels whose serialization actually differs from their baseline
    const {changedPanelsMap} = this.props;
    const submitPanelIdsArr = Object.keys(changedPanelsMap).filter(id => changedPanelsMap[id] === true);

    if (submitPanelIdsArr.length === 0){
      return;
    }

    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_UI_SUBMIT_DATA_EVENT";
    this.sendChannelPayload(action, {submitPanelIdsArr})

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

  onPanelDataStatus(e){
    // panels report their baseline-hash comparison result; the aggregate
    // (any panel changed) drives the publish button via DATA_STATE_CHANGED
    const {rootProxyId, dataHasUpdated} = e.payload;
    this.props.changedPanelsMap[rootProxyId] = dataHasUpdated === true;

    const anyChanged = Object.values(this.props.changedPanelsMap).some(v => v === true);

    if (anyChanged !== this.props.aggregateChanged){
      this.props.aggregateChanged = anyChanged;
      const action = "CHANNEL_SPYNE_JSON_CMS_DATA_UI_DATA_STATE_CHANGED_EVENT";
      this.sendChannelPayload(action, {dataHasUpdated: anyChanged, dataStateChanged: true});
    }

  }

  onPanelChangedEvent(e){
    // legacy persistent-change latch — superseded by onPanelDataStatus,
    // where panels report true hash-based state (including reverts)
  }


  onCmsDataPropertyChanged(e){
    // legacy per-row length-based state machine — superseded by
    // onPanelDataStatus; rows' DATA_UPDATE_CHANGED events no longer drive
    // publish state
  }

  addRegisteredActions() {

    return [
      "CHANNEL_SPYNE_JSON_CMS_DATA_UI_DATA_STATE_CHANGED_EVENT",
      ["CHANNEL_SPYNE_JSON_CMS_DATA_UI_PANEL_DATA_STATUS_EVENT", "onPanelDataStatus"],
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

