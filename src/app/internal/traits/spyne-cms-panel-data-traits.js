import {SpyneTrait} from 'spyne';
import {DataStateMachine} from './utils/data-state-machine';
import {SpyneCmsProxyTraits} from './spyne-cms-proxy-traits';
import {is, all,__, map, uniq, reject, compose} from 'ramda';

export class SpyneCmsPanelDataTraits extends SpyneTrait {

  constructor(context){
    let traitPrefix = "spyneCmsPanelData$";

    super(context, traitPrefix);
  }

  static spyneCmsPanelData$HasCmsValues(cmsId, cmsKey){
    return compose(all(is(String)))([cmsKey, cmsId]);
  }

  static spyneCmsPanelData$HelloWorld(){
    return "Hello World";
  }

  static spyneCmsPanelData$CreateDataStateMachine() {

    return new DataStateMachine();

  }

  static spyneCmsPanelData$GetCmsItemKey(el, type='primitive'){
    const key = el.querySelector('.cms-key input').value;


    return key;
  }

  static spyneCmsPanelData$GetKeyFromDom(el, type='primitive'){

   // type="primitive";
    //console.log("EL IS ",{el,type});

    const objKey = ()=>el.querySelector('.cms-key input').value;
    const propKey = ()=>el.querySelector('label input').value;
    return type === 'primitive' ? propKey() : objKey();

  }

  static spyneCmsPanelData$CheckForPersistentUpdate(props=this.props){
    if (props.dataHasChanged === false){
      this.props.dataHasChanged = true;
      const action = "CHANNEL_SPYNE_JSON_CMS_DATA_UI_PANEL_PERSISTENT_CHANGE_EVENT";
      const channel = "CHANNEL_SPYNE_JSON_CMS_DATA_UI";
      const {rootProxyId} = props.rootData;
      const payload = {rootProxyId, action};
      this.sendInfoToChannel(channel, payload, action);

    }


  }




  static spyneCmsPanelData$GetDataFromDom(dataPanelEl){



    /**
     *
     * TODO: CREATE SEPARATE ACCUMULATOR FOR OBJECTS AND ARRAYS
     *
     * TODO:  IF PRIMITIVE ADD TO ACCUMULATOR, ACC['labelInnerText'] = ACC['inputValue']
     *
     * TODO: IF OBJECT or ARR, ACCUMULATOR['.cms-key p.innerText'] = [":scope div.spyne-cms-property-container > dd dl"].reduce(reduceFn, {} OR [])
     *
     *
     *
     * */


        let primaryKey;


/*        const getKey = (el, type='primitive')=>{

          const objKey = ()=>el.querySelector('.cms-key p').innerText;
          const propKey = ()=>el.querySelector('label').innerText;

          return type === 'primitive' ? propKey() : objKey();

        }*/

        const getPropValue = (el)=>el.querySelector('.cms-panel-input.type-property').value;


    const reduceDomToData = (acc, propContainerEl, index)=>{

      const {cmsType, valueType, overrideVal} = propContainerEl.dataset;
      //const key = getKey(propContainerEl, cmsType);
      const key = SpyneCmsPanelDataTraits.spyneCmsPanelData$GetKeyFromDom(propContainerEl, cmsType);

      if (primaryKey===undefined){
        primaryKey = key;
      }




      if (cmsType === 'primitive'){
        //console.log('primitive ', {key, cmsType, propContainerEl})
          const conformToType = (propContainerEl)=>{
            const valType = valueType || "string";
            const val = overrideVal || getPropValue(propContainerEl);
            const typeHash = {
              "string" : ()=>String(val),
              "HTML" : ()=>String(val),
              "number" : ()=>Number(val),
              "boolean" : ()=>String(val)==="true",
              "null"    : ()=>null
            }
            return typeHash[valType]();
          }



        acc[key] = conformToType(propContainerEl)
        //acc[key] = getPropValue(propContainerEl);
      } else {
        if (overrideVal){
          acc[key] = JSON.parse(overrideVal);
        } else if (propContainerEl.dataset.materialized === 'false'){
          // HYBRID SERIALIZER: lazy sections never materialized into the DOM
          // cannot have been edited — resolve them from the proxy data
          acc[key] = SpyneCmsProxyTraits.spyneCms$ResolveValueByCmsId(propContainerEl.dataset.cmsId);
        } else {
          const nestedAcc = cmsType === 'array' ? [] : {};
          const propsNodeList = propContainerEl.querySelectorAll(
            ":scope > dl > .spyne-cms-property-container > dd");
          //console.log("VALS ",{key, cmsType, nestedAcc}, propsNodeList.length, {propsNodeList})
          acc[key] = Array.from(propsNodeList).reduce(reduceDomToData, nestedAcc);
        }
      }

      return acc;
    }


    // return [dataPanelEl];
    //console.time('dataFromDom');

    const dataFromDom = [dataPanelEl].reduce(reduceDomToData, {});
    //console.timeEnd('dataFromDom');
    // const dataObjFromDom = dataPanelEl
    //console.log('primary key is ',primaryKey, JSON.stringify(dataFromDom[primaryKey]));

    return dataFromDom;



  }



}

