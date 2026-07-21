import {Subject} from 'rxjs';
import {Channel, ChannelPayloadFilter} from 'spyne';
import {MoveStateMachines} from '../traits/utils/move-state-machines';
import {SpyneCmsPanelDataPropertyControlsTraits} from '../traits/spyne-cms-panel-data-property-controls-traits';
const {clone} = require('ramda');

export class ChannelDataPanels extends Channel{

  constructor(name, props={}) {
    name="CHANNEL_DATA_PANELS";
    props.sendCachedPayload = false;
    props.traits = SpyneCmsPanelDataPropertyControlsTraits;
    props.moveStateMachines = new MoveStateMachines();

    super(name, props);
  }


  onDataPanelAdded(e){

    //console.log('DARA panel added ',e);
  }

  onClosePanelEvent(e){
    const {srcElement, payload} = e;
    const {isUIElement} = srcElement.dataset;
    if (isUIElement !== "true" && isUIElement !== true){
      //console.log("close panel e ", {isUIElement, payload, srcElement, e});

      this.onSendControlsPanelEvent();

    }  else {
      //console.log("close panel NOT CALLED e ", {isUIElement, payload, srcElement, e});
    }
  }



  onSendControlsPanelEvent(expand=false, vsid=false){
    const action = "CHANNEL_DATA_PANELS_CONTROL_UI_EVENT";
    const payload = {expand, vsid};
    //console.log("EXPAND IS ",{action, payload})
    this.sendChannelPayload(action, payload);
  }

  onNestedLevelUpdate(e){
    const action = "CHANNEL_DATA_PANELS_NEST_LEVEL_UPDATE";
    const {payload} = e;
    this.sendChannelPayload(action, payload);
  }

  onToggleNestExpand(e){
    const action = "CHANNEL_DATA_PANELS_NEST_EXPAND_OVERRIDE_PROPERTY";
    const {payload} = e;
    this.sendChannelPayload(action, payload);

  }

  onDataPanelControlBtnEvent(e){
    const {payload, srcElement} = e;
    const {type, propertyId} = payload;

    const defaultFn = ()=>{
      //console.log('default control btn event ',type);
    }

    const promptRequestFn = ()=>{
     //console.log("PROMPT REQUEST ",{e,propertyId, type, payload},this.props)
      const action = "CHANNEL_DATA_PANELS_PROMPT_REQUEST_EVENT";
      const newPayload = clone(payload);
      this.sendChannelPayload(action, newPayload)
    }
    const pasteRequestFn = ()=>{
     //console.log("PASTE REQUEST ",{e,propertyId, type, payload},this.props)
      const action = "CHANNEL_DATA_PANELS_PASTE_REQUEST_EVENT";
      const newPayload = clone(payload);
      this.sendChannelPayload(action, newPayload)
    }

    const copyRequestFn = ()=>{
      const action = "CHANNEL_DATA_PANELS_COPY_REQUEST_EVENT";
      const newPayload = clone(payload);
      this.sendChannelPayload(action, newPayload)
    }


    const duplicateFn = ()=>{
      const action = "CHANNEL_DATA_PANELS_APPEND_PROPERTY";
      const newPayload = clone(payload);
      newPayload.dataEvent = "duplicate";
      newPayload.appendType = "appendViewAfter";
     // newPayload.isContainer = false;
      this.sendChannelPayload(action, newPayload);
    }

    const deletePropFn = ()=>{
      const action = "CHANNEL_DATA_PANELS_DELETE_PROPERTY";
      this.sendChannelPayload(action, payload);
    }

    const convertPropFn = ()=>{
      const action = "CHANNEL_DATA_PANELS_CONVERT_PROPERTY_TYPE_EVENT";
      this.sendChannelPayload(action, payload);
    }
    const createPropFn = ()=>{
      const action = "CHANNEL_DATA_PANELS_CREATE_PROPERTY_TYPE_EVENT";
      this.sendChannelPayload(action, payload);
    }


    const eventTypeHash = {
      nestedLevelTag: ()=>this.onNestedLevelUpdate(e),
      nestExpandOverride: ()=>this.onToggleNestExpand(e),
      expand: ()=>this.onSendControlsPanelEvent(true, propertyId),
      prompt: promptRequestFn,
      copy: copyRequestFn,
      paste: pasteRequestFn,
      delete: deletePropFn,
      convert: convertPropFn,
      create: createPropFn,
      duplicate: duplicateFn
    }

    const fn = eventTypeHash[type] || defaultFn;

    //console.log("EVENT IS ",{fn,type, payload, srcElement, propertyId}, )


    fn(e);

  }

  onRegistered(){

    const channelActionFilter = new ChannelPayloadFilter({action:"CHANNEL_SPYNE_JSON_CMS_DATA_ADDED_EVENT"})


    this.getChannel("CHANNEL_SPYNE_JSON_CMS_DATA", channelActionFilter)
        .subscribe(this.onDataPanelAdded.bind(this));


    const dataPanelBtnFilter = new ChannelPayloadFilter({
      selector:['.cms-data-panel-btn', '.expand-override', ".nested-level-tag-btn"],
      action: "CHANNEL_UI_CLICK_EVENT"

    })

    this.getChannel("CHANNEL_UI", dataPanelBtnFilter)
        .subscribe(this.onDataPanelControlBtnEvent.bind(this));


    const windowClickFilter = new ChannelPayloadFilter({
      action: "CHANNEL_WINDOW_CLICK_EVENT"
    })


    this.getChannel("CHANNEL_WINDOW", windowClickFilter)
        .subscribe(this.onClosePanelEvent.bind(this));


    this.cmsPropControls$CreateDragger$();

  }

  onAppendPropRequestCompleted(e){
    const action = "CHANNEL_DATA_PANELS_CHECK_TO_UPDATE_ARRAY";
    const {payload} = e;

    const {parentId} = payload;
    const parentSelector = `[data-cms-id=${parentId}][data-cms-key=false]`;
    const parentContainer = document.querySelector(parentSelector);
    const isArray = parentContainer !== null && parentContainer.dataset['cmsType'] === "array";
    //console.log("APPEND REQUEST CZOMPLETED ",{action,parentSelector, payload, parentId, parentContainer, isArray});

    if (isArray === true){
      const newPayload = Object.assign({parentSelector, isArray}, payload);
      newPayload['activeElementId'] = parentContainer.dataset['vsid'];

      this.sendChannelPayload(action, newPayload);
    }


  }


  onAppendPropRequest(e){
    const {payload} = e;
    const {moveElementId, dataEvent, appendType, action} = payload;
    const isMoveEvent = moveElementId !== undefined && dataEvent === 'duplicate';
    //const {action} = payload;
    const newAction = isMoveEvent === true ? "CHANNEL_DATA_PANELS_MOVE_PROPERTY" : action;

    if (isMoveEvent === true){
      payload['moveStateNum'] = this.props.moveStateMachines.createMoveStateMachine();
    }

    //console.log('append prop request ',{newAction,action,isMoveEvent,appendType, payload, e});

    const delayByFrame = ()=>this.sendChannelPayload(newAction, payload);
    requestAnimationFrame(delayByFrame);
   /* const delayByFrame = ()=>this.sendChannelPayload(action, payload);
   // delayByFrame()

    if (action==="CHANNEL_DATA_PANELS_DELETE_PROPERTY"){
      window.setTimeout(delayByFrame, 50);
    } else {
      delayByFrame();
    }*/
  }

  onTestPassed(e){
    const {payload} = e;
   const action = "CHANNEL_DATA_PANELS_TEST_PASSED_EVENT";
   this.sendChannelPayload(action, payload);

  }
  onDataPanelItemDeleted(e){
    const {payload} = e;
    const {activeElementId} = payload;
    const onSendAfterDeleted = ()=> {
      const action = "CHANNEL_DATA_PANELS_ITEM_DELETED_PROPERTY";
      //console.log("ITEM DELETED ", {activeElementId, payload}, document.querySelector(activeElementId));
      this.sendChannelPayload(action, payload);
    }
    requestAnimationFrame(onSendAfterDeleted)
  }

  onPropertyPasteOverrideValRequest(e){
    const {payload} = e;
    const action = "CHANNEL_DATA_PANELS_PROPERTY_PASTE_OVERRIDE_VALUE_EVENT";
    this.sendChannelPayload(action, payload)

  }

  onUpdateMoveState(e){
    const {payload} = e;
    const {moveStateNum, deleted, moveContainerUpdatedId, activeElementId, moveStateEvent} = payload;
    const {completed, isDeleteReady} = this.props.moveStateMachines.updateMoveState(moveStateNum, moveStateEvent);
    let action;
    //console.log("MOVE EVENT  ",{completed,moveStateEvent,isDeleteReady,moveContainerUpdatedId,activeElementId,moveStateNum,payload})

    if (moveStateEvent === 'movedContainer'){
      action = "CHANNEL_DATA_PANELS_MOVE_COMPLETED_EVENT";
     // moveContainerUpdatedId = moveContainerUpdatedId === undefined ? activeElementId : moveContainerUpdatedId;
     //console.log("MOVE EVENT COMPLETED ",{action,completed,moveContainerUpdatedId,moveStateEvent,moveStateNum,payload})

      //this.sendChannelPayload(action, payload);
      const delayDeletedSendMoved = ()=> this.sendChannelPayload(action, payload);
      requestAnimationFrame(delayDeletedSendMoved);

    } else if (isDeleteReady === true){
      action = "CHANNEL_DATA_PANELS_DELETE_AFTER_MOVING_EVENT";
     //console.log("DELETEED EVENT SENT ",{action,completed,moveContainerUpdatedId,moveStateEvent,moveStateNum,payload})

      this.sendChannelPayload(action, payload);

    } else if (moveStateEvent === 'deleted'){
      action = "CHANNEL_DATA_PANELS_PROPERTY_DELETED_AFTER_MOVING_EVENT";
     //console.log("SENDING AFTER DELETED ",{action,moveStateEvent,moveContainerUpdatedId, activeElementId})

      const delayDeletedSend = ()=> this.sendChannelPayload(action, payload);
      requestAnimationFrame(delayDeletedSend);
    }



  }

  addRegisteredActions() {

    return [
      'CHANNEL_DATA_PANELS_APPEND_PROPERTY',
      'CHANNEL_DATA_PANELS_PROMPT_REQUEST_EVENT',
      'CHANNEL_DATA_PANELS_COPY_REQUEST_EVENT',
      'CHANNEL_DATA_PANELS_PASTE_REQUEST_EVENT',
      'CHANNEL_DATA_PANELS_PROPERTY_PASTE_OVERRIDE_VALUE_EVENT',
      ['CHANNEL_DATA_PANELS_PROPERTY_PASTE_OVERRIDE_VALUE_REQUEST_EVENT', 'onPropertyPasteOverrideValRequest'],

      'CHANNEL_DATA_PANELS_CHECK_TO_UPDATE_ARRAY',
      'CHANNEL_DATA_PANELS_MOVE_PROPERTY',
      'CHANNEL_DATA_PANELS_DRAGSTART_PROPERTY_EVENT',
      'CHANNEL_DATA_PANELS_DRAGMOVE_PROPERTY_EVENT',
      'CHANNEL_DATA_PANELS_DRAGEND_PROPERTY_EVENT',
      'CHANNEL_DATA_PANELS_NEST_LEVEL_UPDATE',
      'CHANNEL_DATA_PANELS_NEST_EXPAND_OVERRIDE_PROPERTY',
      'CHANNEL_DATA_PANELS_CONTROL_UI_EVENT',
      'CHANNEL_DATA_PANELS_MOVE_COMPLETED_EVENT',
      'CHANNEL_DATA_PANELS_DELETE_AFTER_MOVING_EVENT',
      'CHANNEL_DATA_PANELS_DELETE_PROPERTY',
      'CHANNEL_DATA_PANELS_PROPERTY_DELETED_AFTER_MOVING_EVENT',
      'CHANNEL_DATA_PANELS_CONVERT_PROPERTY_TYPE_EVENT',
      'CHANNEL_DATA_PANELS_CREATE_PROPERTY_TYPE_EVENT',
      'CHANNEL_DATA_PANELS_ITEM_DELETED_PROPERTY',
        'CHANNEL_DATA_PANELS_TEST_PASSED_EVENT',
      ['CHANNEL_DATA_PANELS_UPDATE_MOVE_STATE', 'onUpdateMoveState'],
      ['CHANNEL_DATA_PANELS_ITEM_HAS_DELETED_PROPERTY', 'onDataPanelItemDeleted'],
      ['CHANNEL_DATA_PANELS_APPEND_PROPERTY_REQUEST', 'onAppendPropRequest'],
      ['CHANNEL_DATA_PANELS_APPEND_PROPERTY_REQUEST_COMPLETED', 'onAppendPropRequestCompleted'],
      ['CHANNEL_DATA_PANELS_TEST_PASSED_EVENT_REQUEST', 'onTestPassed']
    ];
  }

  onViewStreamInfo(obj) {
    let data = obj.props();
  }

}

