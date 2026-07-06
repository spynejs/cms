import {ViewStream, ChannelPayloadFilter} from 'spyne';
import {SpyneCmsPanelTraits} from '../../traits/spyne-cms-panel-traits';
import {compose, head, defaultTo, values, path} from 'ramda';
import {CmsDataPanelNestedLevelsTags} from './cms-data-panel-nested-levels-tags';
import {CmsDataPanelProperty} from './cms-data-panel-property';
import {SpyneCmsPanelDataObjectTraits} from '../../traits/spyne-cms-panel-data-object-traits';
import {SpyneCmsPanelDataTraits} from "../../traits/spyne-cms-panel-data-traits";
import {SpyneCmsPanelDomUpdaterTraits} from '../../traits/spyne-cms-panel-dom-updater-traits';
import {SpyneCmsDataPanelTestsTraits} from '../../traits/spyne-cms-data-panel-tests-traits';
import {SpyneCmsProxyTraits} from '../../traits/spyne-cms-proxy-traits';
import {forEachObjIndexed} from 'ramda';
//import chai from "chai";
//import {expect} from 'chai';
import {UtilTraits} from '../../traits/util-traits';
//chai.config.showDiff = true;

// above this node count the panel renders lazily: only sections activated by
// page cms-items or panel interaction are materialized (see hybrid serializer
// in SpyneCmsPanelDataTraits for how unmaterialized sections publish)
const LAZY_PANEL_NODE_THRESHOLD = 1000;

const countDataNodes = (val)=>{
  if (val === null || typeof val !== 'object'){
    return 1;
  }
  return 1 + Object.values(val).reduce((acc, v)=>acc + countDataNodes(v), 0);
};

export class CmsDataPanel extends ViewStream {

  /**
   *
   *
   *    OPERATION PARAMETERS
   *
   *    dupe    object     :
   *    dupe    primitive  :
   *
   *    add     object     :
   *    add     primitive  :
   *
   *    move    object     :
   *    move    primitive  :
   *
   *    delete  object     :
   *    delete  primitive  :
   *
   *
   * */


    constructor(props={}) {
        props.traits = [SpyneCmsPanelTraits, SpyneCmsPanelDataObjectTraits, SpyneCmsPanelDataTraits, SpyneCmsPanelDomUpdaterTraits,SpyneCmsDataPanelTestsTraits];
        props.isRoot = true;
        const cmsKey = props.cmsKey = 'root';
        const cmsVal = props.cmsVal =  props.data;
        props.data = {cmsKey, cmsVal};
        props.data.dataType='object';
        props.dataset = {};
        props.dataset['cmsType'] = 'object';
        const rootId =  props.data.cmsVal.__cms__rootData.rootProxyId;
        props.dataset['panelId'] = rootId;
        props.dataset['cmsId'] = `${rootId}0000000000`;
        props.dataset['cmsKey'] = false;
        props.dataHasChanged = false;
        //props.dataset['cmsKey'] = props.data.dataCmsKey;

         props.class = `cms-data-panel ${rootId} focus`;
         props.rootData = props.data.cmsVal.__cms__rootData

         const {idMap} = props.rootData;
         const nestedLevel = SpyneCmsProxyTraits.spyneCms$GetNestedLevelByMap(idMap);

         // lets the static hybrid serializer resolve unmaterialized lazy
         // sections from the proxy data (see spyneCms$ResolveValueByCmsId)
         SpyneCmsProxyTraits.spyneCms$RegisterRootProxy(rootId, idMap, cmsVal, props.rootData.rawData);

         props.isLazyPanel = countDataNodes(cmsVal) > LAZY_PANEL_NODE_THRESHOLD;

         //console.log({nestedLevel,idMap}," ROOT DATA IS ",props.data,' --- ',props.rootData);


      props.template = require('./templates/cms-data-panel-property-container.tmpl.html')
        super(props);
    }

    addActionListeners() {
      const {rootProxyId} = this.props.rootData;

      const onBeginPublishPayloadFilter = new ChannelPayloadFilter({
        payload: (v)=>v.submitPanelIdsArr.includes(rootProxyId)
      })

      //

      const onDataPanelEventFilter = new ChannelPayloadFilter({
        payload: (v)=>v.rootProxyId  === rootProxyId
      });
      const onDataPanelEventFilterByRootId = new ChannelPayloadFilter({
        payload: (v)=>v.rootId  === rootProxyId
      });
      const onDataPanelEventTestDeleteFilter = new ChannelPayloadFilter({
        payload: (v)=>v.rootProxyId === rootProxyId
      });

/*      const testDeletePropFilter = new ChannelPayloadFilter({

      })*/
        // return nexted array(s)
        return [
         ["CHANNEL_CMS_ITEMS_FOCUS_EVENT", "onFocusElementEvent", onDataPanelEventFilterByRootId],
          ["CHANNEL_DATA_PANELS_(APPEND|MOVE)_PROPERTY", "onAppendPropertyEvent", onDataPanelEventFilter],
          ["CHANNEL_DATA_PANELS_CREATE_PROPERTY_TYPE_EVENT", "onCreatePropertyEvent", onDataPanelEventFilter],
         ['CHANNEL_DATA_PANELS_MOVE_COMPLETED_EVENT', 'onMoveCompletedEvent', onDataPanelEventFilter],
         ["CHANNEL_DATA_PANELS_ITEM_DELETED_PROPERTY", "onTestDelete", onDataPanelEventTestDeleteFilter],
         ["CHANNEL_DATA_PANELS_NEST_LEVEL_UPDATE", "spyneCmsPanel$NestedLevelsTagUpdate", onDataPanelEventFilter],
         ['CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_ACTIVATED_EVENT', 'onDataItemsActivated'],
         ['CHANNEL_DATA_PANELS_TEST_PASSED_EVENT', "spyneDPTests$OnTestPassed", onDataPanelEventFilter],
         ['CHANNEL_SPYNE_JSON_CMS_DATA_CONFORM_PUBLISHED_DATA_EVENT', "onBeginPublishData", onBeginPublishPayloadFilter],
         ["CHANNEL_DATA_PANELS_(DRAGMOVE|DRAGEND)_PROPERTY_EVENT", "onDragEvent", onDataPanelEventFilter],
          ["CHANNEL_DATA_PANELS_PROMPT_REQUEST_EVENT", "onPromptMsgEvent", onDataPanelEventFilter],
          ["CHANNEL_DATA_PANELS_PASTE_REQUEST_EVENT", "onPasteMsgEvent", onDataPanelEventFilter]

        ];
    }



    async onPasteMsgEvent(e){

      const { payload } = e;

      const { cmsId, cmsKey, activeElementId, isContainer, parentId } = payload;
      let activeElementEl = this.props.el$(`#${activeElementId}`).el;


      const activeElValue = activeElementEl.querySelector('.cms-panel-input.type-property')?.value;

      const isContainerBool = String(isContainer) === "true";
      const { valueType, cmsType } = activeElementEl.dataset;

      try
      {


        const clipboardType = isContainerBool ? "object" : valueType;
        const clipboardRawValue = await UtilTraits.util$ReadClipboardAndExtractValue();
       //console.log('paste inf1 ',{valueType, cmsType,clipboardRawValue, clipboardType, payload, cmsId, cmsKey, activeElementEl, activeElValue, activeElementId, isContainer, parentId})

        const valueToType = UtilTraits.util$CoerceValueToType(clipboardRawValue, clipboardType);

       //console.log('value to type ',valueToType)
        activeElementEl.dataset['overrideVal'] = valueToType;
        const action = "CHANNEL_DATA_PANELS_PROPERTY_PASTE_OVERRIDE_VALUE_REQUEST_EVENT"
        this.sendInfoToChannel("CHANNEL_DATA_PANELS", {activeElementId, overrideVal:valueToType, isContainer, valueType, cmsType}, action)



      } catch(e){
        console.warn("ERROR ATTEMPTING TO COPY CLIPBOARD")
      }




    }





    static prependPageItemPrompt(activeElementId=""){
      const isPageItem = document.getElementById(activeElementId)
          ?.parentElement?.parentElement?.querySelector(
            ":scope > dt input.cms-panel-input.type-key",
          )?.value === "pageItems";


      const pageItemPrompt = `
SYSTEM (prepended by CMS):

You are generating a SpyneJS page-item.
Page-items may optionally define a container using the following contract:

{
  "container": {
    "enabled": true,
    "classOptions": {
      "variant": "default | muted",
      "flush": false,
      "bleed": false
    },
    "spacing": "default | tight | none"
  }
}

Rules:
- Do NOT add layout or surface classes to component props.
- Use the container object for section framing.
- Only use the options listed above.
- If unsure, use the default container configuration.

Template Loop Rules:

- Arrays may be looped using {{#array}} ... {{/array}}.

- Nested loops are not allowed.
  Loops may not appear inside other loops.

- Conditional blocks inside loops are not allowed.
  Example of invalid usage:
    {{#attrRequired}}required{{/attrRequired}}

- Templates must not contain logic or branching.
  All looping is flat and single-level.

- Attribute presence must be controlled via data values,
  not conditional template blocks.
  
Additional Rules:

- Placeholder data must not define HTML structure.
  Tag names (e.g. input, textarea, div) must be defined in templates only.

- Loops may only be used to bind attribute values or text content.
  They may not be used to switch element types.

- Any data property intended to bind to an HTML attribute
  MUST be prefixed with \`attr\` (e.g. attrId, attrType, attrPlaceholder).

- If isPrototype is false, the template value is treated as a template file name,
  not inline HTML.
  
      
`;

      return isPageItem ? pageItemPrompt : '';


    }

    async onPromptMsgEvent(e){
        const {payload} = e;



        const {cmsId, cmsKey, activeElementId, isContainer, parentId} = payload;

        const dataId = cmsId ?? parentId;

        try {

          const isContainerBool = String(isContainer) === "true";
          let promptPath = this.props.rootData.idMap.get(dataId).join('.');
          let activeElementEl = this.props.el$(`#${activeElementId}`).el;
          const cmsType = activeElementEl.dataset.cmsType;
          const valueType = activeElementEl.dataset.valueType;

          const currentData = this.spyneCmsPanelData$GetDataFromDom(activeElementEl);

          let containerValue = compose(head, defaultTo([]), values)(currentData);

          const rootData = this.props.data?.cmsVal?.__cms__rootData;
          const { fileUrl, fileName } = rootData;

          let currentValue = `\`\`\`json\n${JSON.stringify(containerValue, null, 2)}\n\`\`\``;
          let currentValueType = "JSON";

          if (isContainerBool === false && cmsKey) {
            const primitiveValue = activeElementEl.querySelector('.cms-panel-input.type-property')?.value;
            currentValueType = valueType;
            currentValue = `\`\`\`txt\n${primitiveValue}\n\`\`\``;
            promptPath += `.${cmsKey}`;
          }

         //console.log('data panel ',{e,containerValue, currentValue, currentData}, this.props.data?.cmsVal?.__cms__rootData);
          const actionType = isContainerBool ? 'JSON' : String(currentValueType).toUpperCase();

          const promptRequest = CmsDataPanel.prependPageItemPrompt(activeElementId)+`FILE: ${fileName}
PATH: ${promptPath}
ACTION: Modify the following ${actionType} and return ONLY the updated ${actionType}.
DO NOT return explanations or text outside the ${actionType}.\n
${actionType}: \n${currentValue}\n
INSTRUCTIONS: 
(Write your changes here).\n 
`;

           await UtilTraits.util$CopyToClipboard(promptRequest);

         //console.log(promptRequest);
          /*console.log('prompt msg ', {
            promptPath,
            fileUrl,
            currentValue,
            cmsType,
            isContainerBool,
            dataId,
            cmsKey,
            parentId,
            activeElementId,
            payload
          }, this.props.rootData.idMap);*/

        } catch(e){

          console.warn('error copying prompt to clipboard',e);
        }


      /**
         * TODO: use id map to find path and key and then copy the following to clipboard
         *
         * FILE: placeholder-app-data.json
         * PATH: content.0.image.headline
         * CURRENT VALUE: "Home"
         * ACTION: Update this property.
         *
         *
         * */

    }

    onDragEvent(e){
      const {payload} = e.clone();
     // const {deltaY,propertyId, mouseMoveBool} = payload;



      const updateOnFrame = (p)=>{

        const checkForActiveItem = (el, mouseMoveBool, newY)=>{
          const rect = el.getBoundingClientRect();
            const {top, left} = rect;

            const removeActiveClass = e => e.classList.remove('drag-active');

            document.querySelectorAll("hr.drag-hilight.drag-active").forEach(removeActiveClass);


    /*              const activeEl = document.elementFromPoint(left + 100, top);
              const isActive = activeEl !== null && activeEl.classList.value.indexOf("drag-hilight") >= 0 && deltaY !== 0;

     */


              let {isActive, activeHrEl} = this.spyneCmsPanel$CheckForActiveItem(left+100, top)

              el.classList.toggle('drag-active', isActive);
              if (isActive === true){

                if (mouseMoveBool === true){
                  this.props.moveElementEl = activeHrEl.closest('dd')
                  this.props.moveElementProps = this.spyneCmsPanel$GetMovePropsFromHorzRule(activeHrEl);
                  this.props.deltaY = newY;

                  activeHrEl.classList.add('drag-active');

                } else {

                  const sendMoveActionToChannel = ()=>{

                    const {moveElementEl} = this.props;

                    const moveElementId = moveElementEl.id;
                    const {moveElementProps} = this.props;
                    const {cmsId, cmsType} = moveElementEl.dataset;
                    const rootProxyId =  UtilTraits.util$GetRootProxyId(cmsId);
                    // moveElementEl.style.border = "1px solid blue";

                    const activeElementId = el.id;
                    //this.props.el$(`#${activeElementId}`).el.style.border="1px solid red";
                    // el.style.border="1px solid red";
                    //console.log("SEND MOVE PRE ",{deltaY,moveElementEl, activeHrEl, moveElementId, cmsId, cmsType, rootProxyId, activeElementId})

                    this.spyneCmsPanel$SendMoveActionToChannel({activeElementId, rootProxyId, moveElementProps});

                  }

                  const {deltaY} = this.props;
                  const elHasMoved = Math.abs(deltaY)>30;

                  //console.log("TEST MOVE ",{deltaY, elHasMoved})
                  if (elHasMoved === true){
                    sendMoveActionToChannel();
                  }


                }


              }

             // console.log({top, left, isActive})

        }


        const updateFrame = ()=>{
          const {propertyId, rootProxyId, mouseMoveBool, deltaY} = p;
          const ddEl$ = this.props.el$(`dd#${propertyId}`)

          const moveY = ()=>  ddEl$.el.style.transform = `translateY(${deltaY}px)`

          if (mouseMoveBool === true) {

          }

          requestAnimationFrame(moveY);
          //this.props.el$(`dd#${propertyId}`).el.style.zIndex =  mouseMoveBool ? "10000000" : "initial";
          ddEl$.toggleClass('is-dragging', mouseMoveBool)
          //const rect = this.props.el$(`dd#${propertyId}`).el.getBoundingClientRect();
          checkForActiveItem(ddEl$.el, mouseMoveBool, deltaY);

        }

          requestAnimationFrame(updateFrame)

      }

      updateOnFrame(payload);



      //console.log("src El is ",this.props.vsid,{srcElement, payload})

      //this.props.el.style.transform = `translateY(${deltaY}px)`
      //this.props.el.style.zIndex = "100000";

      //console.log("DRAG EVENT IS ",e);
    }

    onCmsFocusEvent(e){
      const {rootId, cmsId} = e.payload;
      //console.log("CMS FOCUS",{rootId, cmsId}, this.props.rootData.rootProxyId);
    }

    /**
     * HYDRATION: inert rows (data-hydrated="false") become live
     * CmsDataPanelProperty ViewStreams on first interaction. Hydrating the
     * full ancestor chain keeps the invariant that a hydrated row's parent
     * containers are also hydrated (delete/move/array-reindex events are
     * addressed to parent containers).
     */
    addHydrationListeners(){
      const onInteraction = (e)=>{
        // lazy shells materialize their children before anything else —
        // this also guarantees drag-into-shell targets are populated,
        // because mouseover always precedes a drop
        const shellDd = e.target.closest('dd[data-materialized="false"]');
        if (shellDd !== null){
          this.materializeDd(shellDd);
        }

        const dd = e.target.closest('dd[data-hydrated="false"]');
        if (dd === null){
          return;
        }
        this.hydrateDdChain(dd);
      };

      this.props.el.addEventListener('mouseover', onInteraction);
      this.props.el.addEventListener('focusin', onInteraction);
    }

    /**
     * LAZY MODE: fills a shell container with its direct children
     * (grandchildren remain shells).
     */
    materializeDd(dd){
      if (dd.dataset.materialized !== 'false'){
        return;
      }
      const pathArr = this.props.rootData.idMap.get(dd.dataset.cmsId);
      const cmsVal = pathArr !== undefined ? path(pathArr, this.props.data.cmsVal) : undefined;
      if (cmsVal === undefined){
        console.warn(`SPYNE CMS WARNING: unable to materialize panel section, ${dd.dataset.cmsId}`);
        return;
      }
      CmsDataPanelProperty.materializeContainerEl(dd, cmsVal);
    }

    /**
     * LAZY MODE: materializes every ancestor container down to the target
     * cmsId (and the target's own children), so focus/edit flows can find
     * their rows in the DOM. Returns the target container dd or null.
     */
    materializePathToCmsId(cmsId){
      const {idMap} = this.props.rootData;
      const pathArr = idMap.get(cmsId);
      if (pathArr === undefined){
        return null;
      }
      const rootProxy = this.props.data.cmsVal;

      for (let i = 1; i <= pathArr.length; i++){
        const ancestorProxy = path(pathArr.slice(0, i), rootProxy);
        const ancestorId = ancestorProxy?.__cms__dataId;
        if (ancestorId === undefined){
          continue;
        }
        const dd = this.props.el.querySelector(`dd[data-cms-id="${ancestorId}"][data-cms-key="false"]`);
        if (dd !== null){
          this.materializeDd(dd);
        }
      }

      return this.props.el.querySelector(`dd[data-cms-id="${cmsId}"][data-cms-key="false"]`);
    }

    hydrateDdChain(dd){
      const chain = [];
      let el = dd;

      while (el !== null && el !== this.props.el){
        if (el.tagName === 'DD' && el.dataset.hydrated === 'false'){
          chain.unshift(el);
        }
        el = el.parentElement;
      }

      const hydrate = (ddEl)=>{
        const propProps = {el: ddEl};

        if (ddEl.dataset.isContainer === 'true'){
          const pathArr = this.props.rootData.idMap.get(ddEl.dataset.cmsId);
          propProps.cmsVal = pathArr !== undefined ? path(pathArr, this.props.data.cmsVal) : {};
        }

        new CmsDataPanelProperty(propProps);
      };

      chain.forEach(hydrate);
    }

    onFocusElementEvent(e){
      const {cmsId, cmsKey} = e.payload;

      // lazy panels may not have the target section in the DOM yet
      if (this.props.isLazyPanel === true){
        this.materializePathToCmsId(cmsId);
      }

      // primitive rows carry their parent's cmsId plus their own cmsKey
      const focusDd = this.props.el.querySelector(`dd[data-cms-id="${cmsId}"][data-cms-key="${cmsKey}"]`);

      if (focusDd !== null && focusDd.dataset.hydrated === 'false'){
        // the instance created mid-dispatch misses this in-flight event,
        // so hydrate and focus the input directly
        this.hydrateDdChain(focusDd);
        focusDd.querySelector('.cms-panel-input.type-property')?.focus();
      }

      this.spyneCmsPanel$OnFocusElementEvent(e);
    }

  onCreatePropertyEvent(e){
      const {payload} = e;
      //console.log("CREATE PROP EVENT ",payload);
      this.spyneCmsPanelDataObj$CreateNewProperty(payload);
  }

    onBeginPublishData(e){
        const {payload} = e;
        const {submitPanelIdsArr} = payload;
        const {rootData} = this.props;
        const {rootProxyId} = rootData;
        const {fileName} = rootData;
        const fileData = this.spyneCmsPanelData$GetDataFromDom(this.props.el);
        const fileStr = fileData.root

        const publishDataObj = {fileName, fileStr};
        const newPayload  = {rootProxyId, publishDataObj};
        const action = "CHANNEL_SPYNE_JSON_CMS_DATA_CONFORMED_PANEL_DATA_EVENT"
        const channel = "CHANNEL_SPYNE_JSON_CMS_DATA";
        this.sendInfoToChannel(channel, newPayload, action);

      //console.log("on begin publish event is ",{fileName, fileStr, fileData, rootData, submitPanelIdsArr,payload,e}, this.props.rootData.rootProxyId)
    }

    onMoveCompletedEvent(e){
      const {payload} = e;
      const {isTestEvent, activeElementId} = payload;
      //console.log("MOVE COMPLETED EVENT ",{payload, isTestEvent, activeElementId}, this.props);


      //const parentCmsId = this.props.el$(activeElementId).el.dataset.parentCmsId;
      //const parentElProxy = this.props.rootData.idMap.get(parentCmsId);
      //const {rootData} = this.props;
      //console.log("MOVE COMPLETED ON DATA PANEL ",{isTestEvent, rootData, payload, parentCmsId, parentElProxy}, this.props)
      if (isTestEvent === true){
        const delayer = ()=>this.spyneDPTests$StartTestEvent(payload);
        requestAnimationFrame(delayer)

        //window.setTimeout(delayer, 500);
      }

    }

    onAppendPropertyEvent(e){
      const {payload} = e;
      const {isTestEvent, moveElementId, moveElementType, moveStateNum} = payload;

      //console.log("APPEND PROPERTY cms-data-panels ", {isTestEvent, moveStateNum, payload});
      const {appendType, appendSelector} = this.spyneCmsPanelDataObj$AppendNewProperty(payload);
      this.spyneCmsPanelData$CheckForPersistentUpdate();

      if (moveStateNum>=0){
        //console.log("MOVE STATE NUM cms-data-panels",{moveStateNum, appendType, appendSelector,payload});
        const moveStateEvent = 'moved';
        const action = "CHANNEL_DATA_PANELS_UPDATE_MOVE_STATE";
        const moveContainerUpdatedId = moveElementType === 'parent' ? this.props.el$(appendSelector).el.parentElement.closest('dd').id : this.props.el$(appendSelector).el.id;
        const newPayload = Object.assign({moveStateEvent, moveContainerUpdatedId, action}, payload);
        this.sendInfoToChannel("CHANNEL_DATA_PANELS", newPayload, action);

      } else  if (isTestEvent === true && moveStateNum === undefined){
        this.spyneDPTests$CheckTestItem(payload);
      } else {

        this.sendInfoToChannel("CHANNEL_DATA_PANELS", payload, "CHANNEL_DATA_PANELS_APPEND_PROPERTY_REQUEST_COMPLETED");

      }

    }
    onTestDelete(e){
      const {payload} = e;
      const {activeElementId, isTestEvent} = payload;
      //console.log("ITEM DELETED ON PANEL",{payload,activeElementId})

      this.spyneCmsPanelData$CheckForPersistentUpdate();


      if (isTestEvent === true) {
        this.spyneDPTests$StartTestEvent(payload);
      }

      /**
       *
       * TODO: PASS DELETED EVENT TO TEST TRAITS
       *
       *
       * */
    }

    onDataItemsActivated(e){
      // LAZY MODE: cms-items now present in the page DOM drive which panel
      // sections get materialized (payload is the bufferTime batch of
      // SpyneCmsItem connectedCallback events, relayed by SpyneCmsItemsRelay)
      if (this.props.isLazyPanel !== true){
        return;
      }

      const {rootProxyId} = this.props.rootData;
      const items = Array.isArray(e.payload) ? e.payload : [];

      const isThisPanel = (item)=>String(item?.cmsId ?? '').startsWith(rootProxyId);
      items.filter(isThisPanel).forEach((item)=>this.materializePathToCmsId(item.cmsId));
    }

    broadcastEvents() {
        // return nexted array(s)
        return [
        ];
    }

    testDataFromDom(){

      const data = this.spyneCmsPanelData$GetDataFromDom(this.props.el);
      //console.log('data is ',data);

    }

    onRendered() {
     // console.log('data panel is ',this.props.data.cmsVal.__cms__rootData);

      this.addChannel("CHANNEL_SPYNE_JSON_CMS_DATA");
      this.addChannel("CHANNEL_DATA_PANELS");
      this.addChannel("CHANNEL_CMS_ITEMS")
      const {rootProxyId} = this.props.rootData;

      const mapTagObj = (i)=>{
        return {
          rootProxyId,
          num: String(i)
        }
      }



      this.prependView(new CmsDataPanelNestedLevelsTags({

        data: {
          rootProxyId,
          nestedTagsArr: [1,2,3,4,5].map(mapTagObj)
        }

      }));

      if (this.props.isLazyPanel === true){
        // top-level rows only; containers are empty shells materialized on demand
        const cmsVal = this.props.data.cmsVal;
        const frag = CmsDataPanelProperty.renderLazyPropsFrag(cmsVal, cmsVal.__cms__dataId);
        this.props.el.querySelector('.spyne-cms-property-container').appendChild(frag);
      } else {
        this.spyneCmsPanelDataObj$AddProps();
      }
      this.addHydrationListeners();

      /**
       * =========================================
       * TEST MODE INITIATED HERE
       * =========================================
       * */

      //this.spyneDPTests$CheckTestMode();
     //======================================

      let iter = 1;
      const addTestToggleHide =()=>{
        iter ++;
        if (iter>=5){
          iter=1;
        }
        //console.log("THIS PROPS PANEL ",this.props.el$, this.props.el)
        this.props.el.querySelector(":scope > dl").dataset['nestExpandLevel']=String(iter);

      }

      //addTestToggleHide();
      //window.setInterval(addTestToggleHide, 1000);



    }

}

