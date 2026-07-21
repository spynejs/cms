import {ViewStream, ChannelPayloadFilter, DomElementTemplate, safeClone} from 'spyne';
import {UtilTraits} from '../../traits/util-traits';
import {SpyneCmsPanelDataPropertyTraits} from '../../traits/spyne-cms-panel-data-property-traits';
import {SpyneCmsPanelDataObjectTraits} from '../../traits/spyne-cms-panel-data-object-traits';
import {SpyneCmsPanelDomUpdaterTraits} from '../../traits/spyne-cms-panel-dom-updater-traits';
//import 'material-symbols';
const TemplateProperty = require('./templates/cms-data-panel-property.tmpl.html');
const TemplatePropertyContainer = require('./templates/cms-data-panel-property-container.tmpl.html');
import {clone} from 'ramda';
import {CmsDataPanelProperyControlsOptions} from './cms-data-panel-propery-controls-options';

export class CmsDataPanelProperty extends ViewStream {

    constructor(props={}) {
      //console.log("PANEL PROP PROPS ",safeClone(props),safeClone(props.cmsVal, "spyneCmsProxyData"));

      // HYDRATION MODE: props.el is an existing inert dd element (see
      // renderInertPropsFrag); the ViewStream adopts it and skips rendering.
      const isHydration = props.el !== undefined;

      props = isHydration === true ?
          CmsDataPanelProperty.conformHydrationProps(props) :
          CmsDataPanelProperty.conformPanelPropData(props);

      const isContainer = props.isContainer===true;
      props.traits = isContainer ?
          [SpyneCmsPanelDataPropertyTraits, SpyneCmsPanelDataObjectTraits, SpyneCmsPanelDomUpdaterTraits] :
          [SpyneCmsPanelDataPropertyTraits,SpyneCmsPanelDomUpdaterTraits];




      props.stateMachine = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$CreateStateMatchine(props);
      // console.log("props data is ",{isContainer},props.cmsKey,props.data);

      if (isHydration === false){
        props.template = isContainer ? TemplatePropertyContainer : TemplateProperty;
      }

      super(props);
    }


    static conformPanelPropData(props={}, elIsDefined = false){

      if (elIsDefined === false){

        props.tagName='dd';
        //props.sendLifecyleEvents = true;
        const id = UtilTraits.util$CreateId();
        props.id = id;

        props.data = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$ConformPropData(props);
        props.vsid = id;
        props.data.vsid=id;
        props.data.valueType = typeof props.data.cmsVal;
        props.class=`cms-panel-property id-${props.data.dataCmsId} key-${props.data.cmsKey}`;
        props.dataset = {};
        props.dataset['isContainer'] = props.isContainer;
        props.dataset['cmsId'] = props.data.dataCmsId;
        props.dataset['parentCmsId'] = props.data.parentDataId;
        props.dataset['cmsKey'] = props.data.dataCmsKey;
        props.dataset['cmsType'] = props.data.dataType;
        props.dataset['valueType'] = props.data.valueType;
      }

      //console.log("IS CONTAINER");
      //props.tagName = isContainer ? "dl" : "dd";

      return props;


    }

    /**
     * INERT RENDER: builds one dd element identical to what the ViewStream
     * path produces (same id, class, data-* attributes, and template data),
     * but without a ViewStream instance — no channel subscriptions, no state
     * machine, no broadcast listeners. Marked data-hydrated="false" so the
     * root CmsDataPanel can hydrate it on first interaction.
     */
    static buildInertPropEl({cmsKey, cmsVal, parentDataId}){
      const isContainer = cmsVal.__cms__isProxy;
      const id = UtilTraits.util$CreateId();
      const data = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$ConformPropData({cmsKey, cmsVal, parentDataId});
      data.vsid = id;
      data.valueType = typeof data.cmsVal;

      const dd = document.createElement('dd');
      dd.id = id;
      dd.className = `cms-panel-property id-${data.dataCmsId} key-${data.cmsKey}`;
      dd.dataset['isContainer'] = isContainer;
      dd.dataset['cmsId'] = data.dataCmsId;
      dd.dataset['parentCmsId'] = data.parentDataId;
      dd.dataset['cmsKey'] = data.dataCmsKey;
      dd.dataset['cmsType'] = data.dataType;
      dd.dataset['valueType'] = data.valueType;
      dd.dataset['hydrated'] = false;

      const template = isContainer === true ? TemplatePropertyContainer : TemplateProperty;
      const frag = new DomElementTemplate(template, data).renderDocFrag();
      if (typeof frag === 'string'){
        dd.innerHTML = frag;
      } else {
        dd.appendChild(frag);
      }

      return {dd, isContainer};
    }

    /**
     * Recursively renders all entries of a proxified container as inert dd
     * elements, returned as a detached DocumentFragment (single reflow on
     * final append).
     */
    static renderInertPropsFrag(containerVal, parentDataId){
      const frag = document.createDocumentFragment();

      for (let [cmsKey, cmsVal] of Object.entries(containerVal)) {
        // reserved metadata (e.g. the virtual __cms__id tombstone) is not
        // content — keep it out of panel rows and the publish pipeline
        if (String(cmsKey).startsWith('__cms__')){
          continue;
        }
        if (cmsVal === null){
          cmsVal = "null";
        }

        const {dd, isContainer} = CmsDataPanelProperty.buildInertPropEl({cmsKey, cmsVal, parentDataId});

        if (isContainer === true){
          const childFrag = CmsDataPanelProperty.renderInertPropsFrag(cmsVal, cmsVal.__cms__dataId);
          dd.querySelector('.spyne-cms-property-container').appendChild(childFrag);
        }

        frag.appendChild(dd);
      }

      return frag;
    }

    /**
     * LAZY RENDER: like renderInertPropsFrag but container children are NOT
     * rendered — containers become empty shells marked data-materialized="false".
     * Shells are materialized on demand (page cms-item activation or panel
     * interaction); the hybrid serializer resolves unmaterialized shells from
     * the proxy data at publish time.
     */
    static renderLazyPropsFrag(containerVal, parentDataId){
      const frag = document.createDocumentFragment();

      for (let [cmsKey, cmsVal] of Object.entries(containerVal)) {
        // reserved metadata (e.g. the virtual __cms__id tombstone) is not
        // content — keep it out of panel rows and the publish pipeline
        if (String(cmsKey).startsWith('__cms__')){
          continue;
        }
        if (cmsVal === null){
          cmsVal = "null";
        }

        const {dd, isContainer} = CmsDataPanelProperty.buildInertPropEl({cmsKey, cmsVal, parentDataId});

        if (isContainer === true){
          dd.dataset['materialized'] = false;
        }

        frag.appendChild(dd);
      }

      return frag;
    }

    /**
     * Fills a lazy shell with its direct children (grandchild containers stay
     * lazy shells) and flips data-materialized to true.
     */
    static materializeContainerEl(dd, containerVal){
      if (dd.dataset.materialized !== 'false'){
        return;
      }
      const frag = CmsDataPanelProperty.renderLazyPropsFrag(containerVal, dd.dataset.cmsId);
      dd.querySelector('.spyne-cms-property-container').appendChild(frag);
      dd.dataset['materialized'] = true;
    }

    /**
     * Rebuilds ViewStream props from an inert dd element's attributes and
     * inputs. For containers the caller resolves cmsVal from the proxy data
     * via rootData.idMap and passes it as props.cmsVal.
     */
    static conformHydrationProps(props={}){
      const {el} = props;
      const ds = el.dataset;
      const isContainer = ds.isContainer === 'true';
      const id = el.id;

      const keySelector = SpyneCmsPanelDataObjectTraits.spyneCmsPanelDataObj$GetKeySelector(isContainer);
      const cmsKey = el.querySelector(keySelector)?.value;

      let cmsVal = props.cmsVal;
      if (isContainer === false){
        const valEl = el.querySelector('.cms-panel-input.type-property');
        cmsVal = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$ConvertType(valEl?.value, ds.valueType);
      }

      props.isContainer = isContainer;
      props.isHydration = true;
      props.id = id;
      props.vsid = id;
      props.cmsKey = cmsKey;
      props.cmsVal = cmsVal;
      props.data = {
        cmsKey,
        cmsVal,
        dataType: ds.cmsType,
        dataCmsId: ds.cmsId,
        dataCmsKey: ds.cmsKey === 'false' ? false : ds.cmsKey,
        parentDataId: ds.parentCmsId,
        valueType: ds.valueType,
        vsid: id
      };

      return props;
    }

    addActionListeners() {


      const {vsid, data} = this.props;
      const {dataCmsId, dataCmsKey, cmsKey} = data;
      //console.log("VSID IS ",vsid);

      const isVsidPayloadFilter = new ChannelPayloadFilter({

        payload: v=>v.vsid===vsid
      })

      const cmsKeyCheck = this.props.isContainer === true ? cmsKey : dataCmsKey;

      const focusPayloadFilter = new ChannelPayloadFilter({
        payload: (val)=> val.cmsId === dataCmsId && val.cmsKey === cmsKeyCheck
      })

      const isActiveElementFilter = new ChannelPayloadFilter({
        payload: (v)=>v.activeElementId === vsid
      })

      const moveContainerIdFilter = new ChannelPayloadFilter({
        payload: (v)=>v.moveContainerUpdatedId === vsid
      })
      const activeElementIdOrmoveContainerIdFilter = new ChannelPayloadFilter({
        payload: (v)=>[v.moveContainerUpdatedId, v.activeElementId].includes(vsid)
      })
      const isDupeObjAction = this.props.data.cmsKey === "testDupeObj1" ? "CHANNEL_DATA_PANELS_.*" : "CHANNEL_DATA_PANELS_DELETE_PROPERTY";


      const actionsArr = [
          ["CHANNEL_DATA_PANELS_DELETE_PROPERTY", "onDeleteThisProp", isActiveElementFilter],
          ["CHANNEL_DATA_PANELS_DELETE_AFTER_MOVING_EVENT", "onDeleteAfterMove", isActiveElementFilter],
          ["CHANNEL_DATA_PANELS_PROPERTY_PASTE_OVERRIDE_VALUE_EVENT", "onOverrideValue", isActiveElementFilter],
          ["CHANNEL_DATA_PANELS_CONTROL_UI_EVENT", "onAddControlOptions", isVsidPayloadFilter]/*,
          ["CHANNEL_DATA_PANELS_(DRAGMOVE|DRAGEND)_PROPERTY_EVENT", "onDragEvent", isVsidPayloadFilter]*/

      ];


      if (this.props.isContainer === true){
          actionsArr.push(["CHANNEL_DATA_PANELS_NEST_EXPAND_OVERRIDE_PROPERTY", "spyneCmsPanelDataObj$NestExpandOverride", isActiveElementFilter])

          if (this.props.data.dataType==='array'){
            actionsArr.push(["CHANNEL_DATA_PANELS_CHECK_TO_UPDATE_ARRAY", "spyneCmsPanelDataObj$UpdateArrayKeys", isActiveElementFilter])
            actionsArr.push(["CHANNEL_DATA_PANELS_MOVE_COMPLETED_EVENT", "spyneCmsPanelDataObj$UpdateArrayKeys", moveContainerIdFilter])
            actionsArr.push(["CHANNEL_DATA_PANELS_PROPERTY_DELETED_AFTER_MOVING_EVENT", "spyneCmsPanelDataObj$UpdateArrayKeys", activeElementIdOrmoveContainerIdFilter])
            actionsArr.push(["CHANNEL_DATA_PANELS_ITEM_DELETED_PROPERTY", "spyneCmsPanelDataObj$UpdateArrayKeys", isActiveElementFilter])


          }
        //return [];

      } else {
        //actionsArr.push( ["CHANNEL_SPYNE_JSON_CMS_DATA_UI_FOCUS_EVENT", "onCmsFocusEvent", focusPayloadFilter]);
        actionsArr.push(["CHANNEL_CMS_ITEMS_FOCUS_EVENT", "onCmsFocusEvent", focusPayloadFilter]);
        actionsArr.push(["CHANNEL_DATA_PANELS_CONVERT_PROPERTY_TYPE_EVENT", "onConvertTypeEvent", isActiveElementFilter]);
      }
      actionsArr.push( ["CHANNEL_SPYNE_JSON_CMS_DATA_UI_INPUT_CHANGED_EVENT", 'onInputUpdated', focusPayloadFilter]);

      return actionsArr;



    }

    onOverrideValue(e){
        const {payload} = e;
        const {overrideVal, cmsType} = payload;
       //console.log("ELEMENT IS OVERRIDE ", { payload, overrideVal });


      if (cmsType === 'primitive'){
        const inputValueEl$ = this.props.el$(".cms-panel-input.type-property");
        if (inputValueEl$.exists){
          inputValueEl$.el.value = overrideVal;
        }

      } else {

        this.props.el$.addClass('override-disabled');

       //console.log("add class el ",this.props.el$.el);

      }

      this.spyneCmsPanelDataProp$CheckToSendUpdateEvent(overrideVal, true);


    }

    onDragEvent(e){
      const {payload} = e;
      const {deltaY,mouseY, mouseMoveBool} = payload;

      const {origY} = this.props;

      const yOffset =  origY-mouseY;

      this.props.el.style.transform = `translateY(${deltaY}px)`
      this.props.el.style.zIndex = "100000";
     // this.props.el.style.position = mouseMoveBool ? 'absolute' : 'relative';


      //console.log("DRAG EVENT IS ",{yOffset, origY,mouseY, deltaY, mouseMoveBool, payload});
    }

    onUpdateArray(e){
        console.log("UPDATE THIS ARRAY ",this.props.vsid === e.payload.activeElementId, this.props.vsid, e.payload.activeElementId);
    }

  onConvertTypeEvent(e){
      const {payload} = e;
      const {type, valueType} = payload;
      this.props.data.valueType = valueType;
      this.props.el.dataset['valueType'] = valueType;
      const inputEl = this.props.el$('.cms-panel-input.type-property').el
      const value = inputEl.value
      const conversionValue = this.spyneCmsPanelDataProp$ConvertType(value, valueType);
      this.props.data.value = inputEl.value = conversionValue

      const keyboardEvent = new KeyboardEvent('keyup', {
            shiftKey: false,
            ctrlKey: false,
            metaKey: false
          }
      )
     //console.log('convert to ',this.props.el,{inputEl,valueType,conversionValue,keyboardEvent}, this.props.data, this.props.el.dataset.valueType, this.props.el.dataset);

    inputEl.dispatchEvent(keyboardEvent)

  }


    onMoveThenDelete(e){
      //console.log("MOVING CHECK AND THEN DELETE ",)

    }

  onAddControlOptions(e){
    const {vsid, expand} = e.payload;

   // const thisVsid = this.props.vsid;
  //  console.log("vsid check ",thisVsid===vsid,{thisVsid, vsid});
    //console.log('props props is ',this.props);

    if (expand === true) {


      const {data, isContainer} = this.props;

      this.appendView(new CmsDataPanelProperyControlsOptions({data, isContainer}),".controls-right");

      this.spyneCmsPanelDataObj$NestExpandOverride({}, true);

      // this.props.el$('.controls-right').addClass('expand');
    }
  }



  onDeleteAfterMove(e){
    const {payload} = e;
    const {rootProxyId, testId, moveContainerUpdatedId, moveStateNum,testData, dataEvent} = payload;
    const {id$} = this.props;
    const activeElementId = this.props.el.parentElement.closest('dd').id;
    //const isTestEvent = true;
    const action = "CHANNEL_DATA_PANELS_UPDATE_MOVE_STATE";
    const moveStateEvent = 'deleted';
    const newPayload = {rootProxyId, testId, action,moveStateEvent,moveContainerUpdatedId, testData, moveStateNum, dataEvent, activeElementId};

    const channelName = "CHANNEL_DATA_PANELS";

    const delayer = ()=> {
      const sendDeleteEvent = () => {
        //console.log("item has deleted ", {newPayload})
        this.sendInfoToChannel(channelName, newPayload, action);
      }
      //console.log("DELETETING THIS: ", {payload, id$}, this.props.el);
      sendDeleteEvent();

      //requestAnimationFrame(sendDeleteEvent);
      this.disposeViewStream();
    }
    requestAnimationFrame(delayer)

   ///window.setTimeout(delayer, 1000);

  }

  onDeleteThisProp(e){
      const {payload} = e;
      const {rootProxyId, testId, isTestEvent, dataEvent} = payload;
      //const {id$} = this.props;
      const activeElementId = this.props.id$;
      //const isTestEvent = true;
      const action = "CHANNEL_DATA_PANELS_ITEM_HAS_DELETED_PROPERTY";
      const newPayload = {rootProxyId, testId, action, isTestEvent, dataEvent, activeElementId};
      newPayload.activeElementId =this.props.el.parentElement.closest('dd')?.id || this.props.el.parentElement.id;
      const channelName = "CHANNEL_DATA_PANELS";
      const sendDeleteEvent = ()=>{
        //console.log("item has deleted ", {newPayload})
        this.sendInfoToChannel(channelName, newPayload, action);
      }
      sendDeleteEvent();
      //console.log("DELETE: ",{payload, id$});
      //requestAnimationFrame(sendDeleteEvent);
      this.disposeViewStream();
  }



    onCmsFocusEvent(e){
      /**
       * FYI: Nesting of folders on focus occurs on CmsDataPanel,
       * which also owns scroll positioning — focus here must not scroll
       *
       * */

      const {payload} = e;
      this.props.el$('.cms-panel-input.type-property').el.focus({preventScroll: true});
    }

    onInputUpdated(e){
      const {payload} = e;
      const {textVal, isKey, isKeyChangedBool} = payload;
      const sendUpdate =  this.spyneCmsPanelDataProp$CheckToSendUpdateEvent(textVal, isKeyChangedBool);

      //console.log('on input updated ',this.props.vsid,{isKey,isKeyChangedBool,sendUpdate, textVal});

    }

    broadcastEvents() {
        // return nexted array(s)
      const {id$} = this.props;

      if (this.props.isContainer === true){
       // console.log("THIS PROPS ",clone(this.props));
        return [
          [`.controls-left button.toggle[data-property-id="${this.props.vsid}"]`, 'click'],
          [` .cms-panel-input.container-cms[data-cms-id="${this.props.data.dataCmsId}"]`, 'keyup'],
          [`dd:scope > dl > dt > div > div > div.ctrls.controls-right > button.cms-data-panel-btn.container-cms`, 'click'],
          [".cms-data-panel-btn.dragger", "mousedown"],
          [ id$, "mouseup"],
          [ id$, "mouseout"]

        ];
      } else {
        return [
          ['.cms-panel-input', 'keyup'],
          [".cms-data-panel-btn", "click"],
          [".cms-data-panel-btn.dragger", "mousedown"],
          [ id$, "mouseup"],
          [ id$, "mouseout"]

        ];
      }
    }

    onRendered() {

      const {isContainer, isHydration} = this.props;
      //this.appendView(new CmsDataPanelPropertyControls({isContainer,data:this.props.data}), ".controls-container");

      this.addChannel("CHANNEL_DATA_PANELS")


      if(isContainer === true){
        // hydrated containers already have their children in the DOM (inert)
        if (isHydration !== true){
          this.spyneCmsPanelDataObj$AddProps();
        }
        this.addChannel("CHANNEL_SPYNE_JSON_CMS_DATA_UI");


      } else {
        this.addChannel("CHANNEL_SPYNE_JSON_CMS_DATA_UI");
        this.addChannel("CHANNEL_CMS_ITEMS");

      }

      if (isHydration === true){
        this.props.el.dataset['hydrated'] = true;
      }

    }

}

