import {SpyneTrait} from 'spyne';
import {UtilTraits} from './util-traits';

export class SpyneCmsPanelTraits extends SpyneTrait {

  constructor(context){
    let traitPrefix = "spyneCmsPanel$";

    super(context, traitPrefix);
  }

  static spyneCmsPanel$HelloWorld(){
    return "Hello World";
  }

  static spyneCmsPanel$GetMovePropsFromHorzRule(hrEl){
    const {moveElementId, moveElementType, appendType, cmsId, cmsType} = hrEl.dataset;
    return {moveElementId, moveElementType, appendType, cmsId, cmsType};
  }

  static spyneCmsPanel$SendMoveActionToChannel({activeElementId, rootProxyId, moveElementProps}){
/*    const activeElementId = hilightEl.closest('dd').id;
    const moveElementId = moveElement.id;*/

/*    const moveElementId = hilightEl.closest('dd').id;
    const activeElementId = moveElement.id;*/

  //  const {cmsId, cmsType} = moveElement.dataset;
   // const rootProxyId =  UtilTraits.util$GetRootProxyId(cmsId);

    const {moveElementId, moveElementType, appendType, cmsId, cmsType} = moveElementProps;
    const dataEvent = "duplicate";
    const duplicateActiveElementBool = true;
   // const appendType = "appendViewAfter";// cmsType === "primitive" ? "appendViewAfter" : "appendView";
    const action = "CHANNEL_DATA_PANELS_APPEND_PROPERTY_REQUEST";
    const channel = "CHANNEL_DATA_PANELS";

    //console.log("SEND INFO TO CHANNEL ",{activeElementId,appendType, moveElementId, dataEvent, action})
    this.sendInfoToChannel(channel, {activeElementId, rootProxyId, moveElementId, moveElementType, appendType, cmsId, cmsType, dataEvent, action}, action);

  }

  static spyneCmsPanel$CheckForActiveItem(x, y, className="drag-hilight"){

    let isActive = false;
    let iter = 0;
    const activeEls = document.elementsFromPoint(x,y);
    let activeHrEl;

    //console.log("active els ", activeEls, iter, activeEls.length);

    while(isActive === false && iter < activeEls.length){

      const el = activeEls[iter];
      isActive = el !== undefined && el.classList.value.indexOf(className) >= 0;

      activeHrEl = isActive ? el : undefined;


      iter++;
    }


    return {isActive, activeHrEl};
  }


  static spyneCmsPanel$SetNestedLevel(n=1){
    this.props.el.querySelector(":scope > dl").dataset['nestExpandLevel'] = String(n);
  }

  static spyneCmsPanel$ClearNestedOverrides(){
    const updateNestLevelOverride = (el)=>el.dataset['nestExpandOverride']="";
    this.props.el$('dl').arr.forEach(updateNestLevelOverride)
  }

  static spyneCmsPanel$SetOverrideByCmsId(cmsId){
    if (cmsId === undefined){
      console.warn("CMS ID IS UNDEFINED");
      return;
    }
    const sel = `dd[data-cms-id="${cmsId}"][data-cms-key=false]`;
    this.props.el$(sel).el.dataset['nestExpandOverride'] = "true";
  }

  static spyneCmsPanel$OnFocusElementEvent(e){
    const {rootId, cmsId} = e.payload;
    const sel = `dd[data-cms-id="${cmsId}"][data-cms-key=false]`;

    /**
     * The app's cms items are only re-rendered on publish, so between
     * deleting a container and publishing, hovering its rendered items sends
     * a cmsId this panel no longer holds — an expected state, not an error.
     * querySelector instead of el$ keeps the framework's missing-selector
     * warning out of the console for this case.
     * */
    const parentDD = this.props.el.querySelector(sel);

    if (parentDD === null){
      return;
    }

    let nestLevel = 0;
    const getClosestDl = el => {
      if (el.parentElement !== null){
        return el.parentElement.closest('dl');
      }
      return null;
    }

    const currentDl = parentDD.querySelector('dl');

    let iterDl = parentDD;

    while(iterDl!==null){
      iterDl = getClosestDl(iterDl);
      nestLevel++;

    }

    //console.log("CURRENT DL ",{nestLevel,currentDl, parentDD, sel, rootId, cmsId})

    this.spyneCmsPanel$SetNestedLevel(nestLevel);
    this.spyneCmsPanel$ClearNestedOverrides();
    currentDl.dataset['nestExpandOverride'] = "true";

  }


  static spyneCmsPanel$NestedLevelsTagUpdate(e){
    const {payload} = e;
    const {nestLevel} = payload;
    //console.log("TAG LEVEL IS ", {nestLevel,payload},this.props.el);
    this.spyneCmsPanel$SetNestedLevel(nestLevel);
    this.spyneCmsPanel$ClearNestedOverrides();


  }

  static spyneCmsPanel$FileNameOnly(str){
     const re = /^([^\0]*)(\.\w{3,4})$/g;
     return String(str).replace(re, "$1");
  }

}

