import {SpyneTrait} from 'spyne';
import {UtilTraits} from './util-traits';
import {all, compose, is} from 'ramda';


export class SpyneCmsPanelDataPropertyTraits extends SpyneTrait {

  constructor(context){
    let traitPrefix = "spyneCmsPanelDataProp$";

    super(context, traitPrefix);
  }

  static spyneCmsPanelDataProp$ConformPropData(props){
    const {cmsKey, cmsVal, parentDataId} = props;
    const dataType = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$GetProxyType(cmsVal);
    const dataCmsId  = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$GetDataId(cmsVal, parentDataId);
    const dataCmsKey = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$GetDataCmsKey(cmsKey, cmsVal, props.parentDataId);
    const inputId = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$createInputId();
    const {inputType, rowsNum } = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$GetInputValues(cmsVal);
    const inputSuffix = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$GetInputSuffix(inputType, cmsVal);

    return {
      cmsKey, cmsVal, dataType, dataCmsId, dataCmsKey, inputType, inputSuffix, rowsNum, inputId, parentDataId
    }
  }

  static spyneCmsPanelDataProp$GetInputSuffix(inputType="input", cmsVal=""){
    const textAreaSuffix = ()=>`>${cmsVal}</textArea>`;
    const inputSuffix = ()=>`value='${cmsVal}' >`;
    return inputType === 'input' ? inputSuffix() : textAreaSuffix();
  }


  static spyneCmsPanelDataProp$GetInputValues(cmsVal){
    let inputType = 'input';
    let rowsNum = 0;
    const shortTxtRE = /^((\d)+|true|false|(http(s)?.*)|\/\/.*|([a-zA-Z\w\s\S\W\\/]{0,34}))$/m;
    const hasLineBreak = /[\r\n\u2028\u2029]|<br\s*\/?>/m;

    const type = UtilTraits.util$GetType(cmsVal);
    if (type!=='primitive'){
      return {inputType, rowsNum};
    }

    const isInputTxt = shortTxtRE.test(cmsVal);
    inputType = !isInputTxt || hasLineBreak.test(cmsVal) ? 'textarea' : inputType;
    rowsNum = isInputTxt ? rowsNum : Math.ceil(String(cmsVal).length / 33);

    return {inputType, rowsNum }

  }


  static spyneCmsPanelDataProp$GetProxyType(cmsVal){
    return cmsVal.__cms__type ||  UtilTraits.util$GetType(cmsVal);;
  }

  static spyneCmsPanelDataProp$GetDataId(data=this.props.data, parentDataId){
    const {__cms__isProxy, __cms__dataId} = data;
    return __cms__isProxy === true ? __cms__dataId  : parentDataId !== undefined ? parentDataId : false;

  }

  static spyneCmsPanelDataProp$GetDataCmsKey(cmsKey, cmsVal, parentDataId){
    const type = UtilTraits.util$GetType(cmsVal);
    const addKey = type === 'primitive' && UtilTraits.util$Exists(parentDataId) === true;
    return addKey === true ? cmsKey : false;

  }

  static spyneCmsPanelDataProp$GetDataIdAndKey(data=this.props.data, parentDataId){
    const dataCmsId = SpyneCmsPanelDataPropertyTraits.spyneCmsPanelDataProp$GetDataId(data, parentDataId);
    const dataCmsKey = '';
    //const cmsKey = parentDataId !== undefined &&

  }

  static spyneCmsPanelDataProp$createInputId() {
    return 'input-'+Math.random().toString(36).replace(/\d/gm, '').substring(1,8);
  }

  static spyneCmsPanelDataProp$CheckToSendUpdateEvent(str,isKeyChangedBool=-1, stateMachine=this.props.stateMachine){
    const channelName = "CHANNEL_SPYNE_JSON_CMS_DATA_UI";
    const action =      "CHANNEL_SPYNE_JSON_CMS_DATA_UI_DATA_UPDATE_CHANGED_EVENT";
    let valChanged;

    if (isKeyChangedBool === -1) {
      let {stateChanged, valChanged} = stateMachine(str);

      if (stateChanged === true) {
        this.sendInfoToChannel(channelName, {valChanged}, action)
      }
    } else {
      valChanged = isKeyChangedBool;
      const isKey=true;
      this.sendInfoToChannel(channelName, {valChanged, isKey}, action)
    }

    return stateMachine(str);
  }

  static spyneCmsPanelDataProp$ConvertType(val, type='string'){
    /**
     * Valid Types: "string", "Rich Text", "number", "boolean", "null"
     * */

    const convertToNumber = (n)=>{
      const isNumeric = parseFloat(n) === parseFloat(n)
      return isNumeric ? parseFloat(n) : [true, 'true'].includes(n)
                       ? 1 : 0;
    }



    const convertToBoolean = val => ['true', true].includes(String(val).toLowerCase()) || parseFloat(val)>0;

    const convertToString = (s)=>String(s);

    const convertToNull = ()=>null;


    const conversionHash = {
            "string": convertToString,
            "HTML": convertToString,
            "number": convertToNumber,
            "boolean": convertToBoolean,
            "null" : convertToNull

         }

        //console.log("TYPE IS ",{type, val})

     const fn = conversionHash[type];

      return fn(val);

  }

  static spyneCmsPanelDataProp$CreateStateMatchine(props=this.props){
      const isNewPropFn = (key, val)=>compose(all(is(String)))([key,val])===false;


      if(props.data === undefined){
        //console.log("PROPS UNDEFINED ",props);

      }

      let stateChanged = false;
      let valChanged = false;
      let prevValChanged = false;
      const {isContainer} = props;
      const {cmsVal, dataCmsId, dataCmsKey} = props.data;
      const isNewProp = isNewPropFn(dataCmsKey, dataCmsId);
      const cmsValLen = String(cmsVal).length;

      if (isContainer === String(true)) {
        return ()=>({stateChanged:false, valChanged: false});
      } else if (isNewProp === true){
        return ()=>({stateChanged:true, valChanged: false});
      }


     return (newVal)=>{


        if (newVal === undefined){
          return {stateChanged};
        }

        const newValLen = String(newVal).length;
        valChanged = newValLen!==cmsValLen && newVal!==cmsVal;

        stateChanged = valChanged !== prevValChanged;

        prevValChanged = valChanged;

        //console.log({cmsVal, newVal, stateChanged, valChanged, cmsValLen, newValLen})
        return {stateChanged, valChanged};


      }

  }

}

