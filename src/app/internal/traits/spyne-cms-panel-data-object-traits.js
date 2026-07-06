import {SpyneTrait} from 'spyne';
import {CmsDataPanelProperty} from '../components/spyne-cms/cms-data-panel-property';
import {SpyneCmsProxyTraits} from './spyne-cms-proxy-traits';
import {SpyneCmsPanelDataPropertyTraits} from './spyne-cms-panel-data-property-traits';
import {SpyneCmsPanelDomUpdaterTraits} from './spyne-cms-panel-dom-updater-traits';
import {UtilTraits} from './util-traits';
import {compose, sort, head, descend, concat, clone, defaultTo, ascend} from 'ramda';

export class SpyneCmsPanelDataObjectTraits extends SpyneTrait {

  constructor(context){
    let traitPrefix = "spyneCmsPanelDataObj$";

    super(context, traitPrefix);
  }




  static spyneCmsPanelDataObj$startDrag(){


  }


  static spyneCmsPanelDataObj$GetKeyForObj(labelsArr){
    const newKeyRE = /^(newKey)(\d+)$/gm;
    const newKeyREMatch = /^(((newKey)(\d+))|(.*))$/gm;


    const getKeyLabelNums = (acc, labelStr) => {
      let numVal = String(labelStr).replace(newKeyREMatch, "$4");
      if (UtilTraits.util$Exists(numVal) === true){
        acc.push(String(parseInt(numVal)+1));
      }
      return acc;

    }
    let reduceLabelsArr = labelsArr.reduce(getKeyLabelNums, []);

    let finalLabel = compose( concat('newKey'), defaultTo(''),head,sort(ascend))(reduceLabelsArr);


    return finalLabel;

  }


  static spyneCmsPanelDataObj$GetNewPropKey(type, propContainerEl){
    const propsArr = Array.from(propContainerEl.querySelectorAll('dd'))
    return type === 'array' ? propsArr.length : SpyneCmsPanelDataObjectTraits.spyneCmsPanelDataObj$GetKeyForObj(propsArr);
  }


  static spyneCmsPanelDataObj$GetNewPropData(type='primitive'){
    //const cmsId = -1;
    //const parentDataId = -1;
    //const cmsKey = SpyneCmsPanelDataObjectTraits.spyneCmsPanelDataObj$GetNewPropKey(type, propContainerEl);
    const cmsValHash = {
      "primitive" : "",
      "array" : [],
      "object" : {}
    }
    const newKey = cmsValHash[type];
    if (newKey===undefined){
      console.warn('CMS DATA PANEL INSERT NEW PROP WARNING: type is wrong or missing');
    }

    return  {newKey}

  }


  static spyneCmsPanelDataObj$CreateNewProxyProp(type='primitive', rootData={rootProxyId: SpyneCmsProxyTraits.spyneCms$GenerateRootProxyId()}){
    const propData = SpyneCmsPanelDataObjectTraits.spyneCmsPanelDataObj$GetNewPropData(type);


    const proxyProperty = SpyneCmsProxyTraits.spyneCms$ProxifyJsonData(propData, rootData);

    return {proxyProperty, rootData};
  }


  static spyneCmsPanelDataObj$InsertNewProp(panelPropertyEl, type='primitive'){

      const panelPropertyElType = panelPropertyEl.dataset.cmsType;


      // THE DIV PROPS CONTAINER IS EITHER AN ELEMENT OF A CONTAINER OR A PRIMITIVE'S PARENT
      const propContainerEl = panelPropertyElType === 'primitive' ? panelPropertyEl.parentElement : panelPropertyEl.querySelector('.spyne-cms-property-container');
      //Array.from(temp1.parentElement.querySelectorAll('dd')).indexOf(temp1)
      const propData = SpyneCmsPanelDataObjectTraits.spyneCmsPanelDataObj$GetNewPropData(type, propContainerEl);
      const newPanelProp = new CmsDataPanelProperty(propData);

      // COLLECT ID TO SEND SELEECTOR;
      const id = newPanelProp.props.id$;
      newPanelProp.appendToDom(propContainerEl);


      //  IF DD IS CHILD OF CONTAINER ADD NEW ELEMENT DIRECTLY AFTER THE CHILD
      if (panelPropertyElType === 'primitive'){
        //console.log('prop data is ',propData);
       // panelPropertyEl.after(newPanelProp.el);
      }


      return id;

  }

  static spyneCmsPanelDataObj$CreateNewProperty(appendProps={}){
    /**
     *
     * const {activeElementId, valueType} = appendProps;
     *
     * {
     *     "cmsKey": "prop21",
     *     "cmsVal": "property number two",
     *     "parentDataId": "cms-47799000-0000002000",
     *     "isContainer": false
     * }
     *
     * const cmsValHash = {
     *           "primitive" : ()=>"value",
     *           "array" : ()=>[],
     *           "object" : function(){return {}}
     *         }
     *
     * const parentDataId = activeElementId.dataset.parentId;
     * const parentSelector = SpyneCmsPanelDomUpdaterTraits.spyneDomUpdater$GetPropertySelectorByData(parentDataId, 'false');
     * const isContainer = ['array', 'object'].includes[valueType];
     * const cmsKey = spyneDomUpdater$GetNewPropertyCmsKey({parentSelector})
     * const cmsVal = cmsValHash[valueType] || "value";
     *
     * const appendType = "appendView";
     * const appendSelector = `${parentSelector} dl .spyne-cms-property-container`;
     *
     * const itemProps = {cmsKey, cmsVal, parentDataId, isContainer};
     *
     *
     *
     * this[appendType](new CmsDataPanelProperty(itemProps), appendSelector);
     *
     * */
    const {activeElementId, valueType, parentId, cmsId, appendType} = appendProps;
    const cmsValHash = {
      "primitive" : ()=>"value",
      "array" : ()=>[],
      "object" : function(){return {}}
    }
    const parentDataId = cmsId;
    const dataEvent = valueType;
    const parentSelector = `dd${SpyneCmsPanelDomUpdaterTraits.spyneDomUpdater$GetPropertySelectorByData(cmsId, 'false')}`;
    const isContainer = ['array', 'object'].includes(valueType);
    ;
    const cmsKey = this.spyneDomUpdater$GetNewPropertyCmsKey({parentSelector})

    const cmsValFn = isContainer === true ?
        ()=>this.spyneDomUpdater$GetNewPropertyCmsVal({parentDataId,dataEvent}) :
        ()=> SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$ConvertType(undefined, valueType);

    //const cmsVal = cmsValHash[valueType] || "value";


   // const cmsVal = this.spyneDomUpdater$GetNewPropertyCmsVal({parentDataId,dataEvent})
    const cmsVal = cmsValFn()

    //console.log("APPEND SELECTOR ", {cmsKey, cmsVal,valueType, parentDataId,cmsId, parentSelector, isContainer});


    /**
     * TODO: convert primitives to correct value;
     * TODO: BUG FIX: new prop going to parent instead of current object
     *
     * */


    const appendSelector = `${parentSelector} dl .spyne-cms-property-container`;

    const itemProps = {cmsKey, cmsVal, parentDataId, isContainer};


    this[appendType](new CmsDataPanelProperty(itemProps), appendSelector);

  }


  static spyneCmsPanelDataObj$AppendNewProperty(appendProps={activeElementId,duplicateActiveElementBool, dataEvent, moveElementId}, props=this.props){
    //console.log("APPEND PROPS ",appendProps);
    const {appendType, appendSelector, itemProps} =  SpyneCmsPanelDomUpdaterTraits.spyneDomUpdater$GetAppendParams(appendProps, props);

    //console.log('append selector is ',appendSelector)

   // const appendSelectorComplete = appendType === "appendViewAfter" ? appendSelector : `${appendSelector} dl .spyne-cms-property-container`;

    //console.log('append new props props ',clone(itemProps),{appendType, appendSelector, itemProps})
    //itemProps.isContainer = false;

    this[appendType](new CmsDataPanelProperty(itemProps), appendSelector);

    return {appendType, appendSelector};
  }

  static spyneCmsPanelDataObj$AddProps(props = this.props){
    // INERT RENDER: children are built as plain DOM (no ViewStream per node)
    // and hydrated on first interaction by the root CmsDataPanel.
    const {__cms__dataId} = props.cmsVal;
    const parentDataId = __cms__dataId;

    const frag = CmsDataPanelProperty.renderInertPropsFrag(props.cmsVal, parentDataId);
    this.props.el.querySelector('.spyne-cms-property-container').appendChild(frag);

  }

  static spyneCmsPanelDataObj$NestExpandOverride(e){
    const dlEl = this.props.el.querySelector(":scope > dl");
    const {nestExpandOverride} = dlEl.dataset;
    const isOverrideBool = nestExpandOverride === "true" || dlEl.offsetHeight>=60;
    dlEl.dataset['nestExpandOverride'] = !isOverrideBool;

    //console.log("EXPAND OVERRIDE ",{dlEl, nestExpandOverride, isOverrideBool, e});
  }

  static spyneCmsPanelDataObj$GetKeySelector(isContainer=true){
    return isContainer ? ":scope > dl > dt > input" : ":scope > label > input";
  }

  static spyneCmsPanelDataObj$UpdateArrayKeys(e, parentEl=this.props.el){

    //console.log("CHECK ARR AFTER DELETE ",e, parentEl);

    const arrayItemsEl = parentEl.querySelectorAll(":scope > dl > .spyne-cms-property-container > dd");

    const updateKeys = (el, i)=>{

      const isContainer = el.dataset['isContainer'] === "true";
      const inputElSelector = SpyneCmsPanelDataObjectTraits.spyneCmsPanelDataObj$GetKeySelector(isContainer);
      const inputEl = el.querySelector(inputElSelector);
      const oldValue = inputEl.value;

      inputEl.value = i;
      //console.log("VALUE IS ", {oldValue, inputElSelector, inputEl}, i);

    }

     Array.from(arrayItemsEl).forEach(updateKeys);

  }




}

