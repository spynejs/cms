import {SpyneTrait} from 'spyne';
import {UtilTraits} from './util-traits';
import {all} from 'ramda';
export class CmsSelectItemBoxTraits extends SpyneTrait {

  constructor(context){
    let traitPrefix = "cmsSelectItem$";

    super(context, traitPrefix);
  }


  static cmsSelectItem$createActiveStateChecker(){

    let currentActiveElement, currentCmsId, currentCmsKey;
    let isActiveBool = false;
    let activeElementUpdatedBool = false;

    const nilCheckFn = UtilTraits.util$Exists;

    const stateChecker = (cmsItemProps={}) => {
      const {cmsId, cmsKey, activeElement} = cmsItemProps;

      const isActiveBool = all(nilCheckFn, [cmsId, cmsKey, activeElement])

      const isSameElement = activeElement === currentActiveElement;
      const isSameId = cmsId === currentCmsId;
      const isSameKey = cmsKey === currentCmsKey;

      activeElementUpdatedBool = isSameElement === false || isSameId === false || isSameKey === false;

      currentActiveElement = activeElement;
      currentCmsId = cmsId;
      currentCmsKey = cmsKey;
      //const isActiveBool = activeElement !== null && cmsId


      return {cmsId, cmsKey, isActiveBool, activeElementUpdatedBool,activeElement}
    }


    return stateChecker;

  }

  static cmsSelectItem$IsAvailable(spyneCmsItem){

    const textEl = spyneCmsItem.parentElement;

    const {height, visibility, opacity, display} = window.getComputedStyle(textEl);

    const isHeightAvail = Number.parseInt(height) !== 0;
    const isVisible = visibility === 'visible';
    const isOpaque = Number.parseInt(opacity) !== 0;
    const isDisplayed = display !== 'none';

    return isHeightAvail === true && isVisible === true && isOpaque === true && isDisplayed === true;


    //console.log('getting display stuff is ',{height,visibility,opacity,display});


  }


  static cmsSelectItem$GetSelectedItems(cmsId, cmsKey){

    return document.querySelectorAll(`spyne-cms-item[data-cms-id="${cmsId}"][data-cms-key="${cmsKey}"]`);

  }

  static cmsSelectItem$GetItemsByCmsIds(cmsIdsArr = []){

    const selector = cmsIdsArr.map(id => `spyne-cms-item[data-cms-id="${id}"]`).join(', ');

    return selector === '' ? [] : Array.from(document.querySelectorAll(selector));

  }

  static cmsSelectItem$MarkItemsDeleted(itemsArr){

    const forEachElement = (el)=>el.classList.add('cms-item-deleted');

    return itemsArr.forEach(forEachElement);

  }

  static cmsSelectItem$UpdateCmsItems(itemsArr, value){

    const forEachElement = (el)=>el.querySelector('spyne-cms-item-text').innerHTML = value;

    return itemsArr.forEach(forEachElement);

  }



  static cmsSelectItem$SetClientRect(rectBox){

    const setBoundingBox = (l, t, w, h)=>{
      const left = Math.max(l-8, 2);
      const top = Math.max(t-8, 6);
      const width = w+16;
      const height = h+16;

      this.props.el.style.cssText = `top:${top}px; left:${left}px; width:${width}px; height:${height}px`;

      const rectBorder = this.props.el$('svg rect.cms-select-item-border').el;
      const rectHitbox = this.props.el$('svg rect.cms-select-item-hitbox').el;

      rectHitbox.setAttribute('width', `${width-8}px`)
      rectHitbox.setAttribute('height', `${height-8}px`)


      rectBorder.setAttribute('width', `${width}px`)
      rectBorder.setAttribute('height', `${height}px`)

    }


    const box = rectBox;// tgtItem.parentElement.getBoundingClientRect();
    const {x, y, width, height} = box;

    setBoundingBox(x,y,width,height);

    //console.log("box is ", {x, y, width, height, box});

  }

}

