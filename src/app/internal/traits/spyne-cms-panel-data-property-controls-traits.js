import {SpyneTrait, ChannelPayloadFilter} from 'spyne';
import {UtilTraits} from './util-traits';
import {
  fromEvent,
  combineLatest,
  mergeWith,
  take,
  takeLast,
  concatAll,
  concat,
  share,
  reduce,
  skipWhile,
  buffer, bufferCount, bufferTime, skip,
} from 'rxjs';
import {
  startWith,
  switchMap,
  takeUntil,
  map,
  tap,
  last, takeWhile,
} from 'rxjs/operators';

export class SpyneCmsPanelDataPropertyControlsTraits extends SpyneTrait {

  constructor(context){
    let traitPrefix = "cmsPropControls$";

    super(context, traitPrefix);
  }

  static cmsPropControls$CreateDragger$(){
    const selector = ".cms-data-panel-btn.dragger"

    const mouseDownFilter = new ChannelPayloadFilter({
      selector,
      action: "CHANNEL_UI_MOUSEDOWN_EVENT"
    })

    const mouseMoveFilter = new ChannelPayloadFilter({
      selector,
      action: "CHANNEL_UI_MOUSEMOVE_EVENT"
    })

    const mouseUpFilter = new ChannelPayloadFilter({
      selector,
      action: v=>["CHANNEL_UI_MOUSEUP_EVENT", "CHANNEL_UI_MOUSEOUT_EVENT"].includes(v)
    })

    const windowMouseFilter = new ChannelPayloadFilter({
      action: "CHANNEL_WINDOW_MOUSEOVER_EVENT"
    })

    const windowUpFilter = new ChannelPayloadFilter({
      action: v=>["CHANNEL_WINDOW_CLICK_EVENT", "CHANNEL_WINDOW_MOUSEUP_EVENT"].includes(v)
    })


    const windowUpFilter1 = new ChannelPayloadFilter({
      action: "CHANNEL_WINDOW_MOUSEUP_EVENT"
    })

    const dragStart$ = this.getChannel("CHANNEL_UI", mouseDownFilter);
    let mouseMove$ = this.getChannel("CHANNEL_UI",mouseMoveFilter );

    const windowMove$ = this.getChannel("CHANNEL_WINDOW", windowMouseFilter);
    const dragUp$ = this.getChannel("CHANNEL_UI", mouseUpFilter);
    const dragUpWindow$ = this.getChannel("CHANNEL_UI", windowUpFilter);


    /**
     * TODO: CREATE ACTION AND SEND CHANNEL PAYLOAD FOR MOVE EVENT
     *
     * */

    const log$ = tap((e)=>console.log("TAPPER ",e))

    const takeWhilePred = e => e.action === "CHANNEL_UI_MOUSEMOVE_EVENT";


/*
    const dragMove$ = dragStart$.pipe(
        switchMap(
            (start) => {
              return mouseMove$.pipe(

                  map(moveEvent => {
                    moveEvent.event.preventDefault();
                      const {payload} = moveEvent.clone();
                      payload['deltaY'] = moveEvent.event.pageY - start.event.pageY;
                      payload['startOffsetY'] = start.event.offsetY;
                      payload['mouseX'] = moveEvent.event.x;
                      payload['mouseY'] = moveEvent.event.y;
                    moveEvent.payload = payload;
                    return moveEvent;
                  }),

                  takeUntil( dragUp$.pipe(log$)));
            }));

*/

/*

const dragMove$ = dragStart$.pipe(
    switchMap(
        (start)=> {
          let mouseMoveBool = true;

          return mouseMove$.pipe(
              mergeWith(dragUp$),
              skipWhile(e=>e===undefined || e.length<1),
              takeWhile(()=>mouseMoveBool === true),
              map(

                  (e) => {

                  /!*  if (eArr === undefined || eArr.length<1 || eArr[0]===undefined){
                      return;
                    }


                    const e = eArr[0];
                    console.log("E IS ",e);*!/

                    mouseMoveBool = e.action === "CHANNEL_UI_MOUSEMOVE_EVENT";
                    const {payload}   =        e.clone();
                    payload['mouseMoveBool'] = mouseMoveBool;
                    payload['deltaY'] =        (e.event.pageY - start.event.pageY)*1;
                    payload['deltaY1'] =        mouseMoveBool ? e.event.pageY - start.event.pageY : 0;
                    payload['startOffsetY'] =  start.event.offsetY;
                    payload['mouseX'] =        e.event.x;
                    payload['mouseY'] =        e.event.y;
                    payload['vsid']   =        payload.propertyId;
                    e.action = mouseMoveBool ?
                        "CHANNEL_DATA_PANELS_DRAGMOVE_PROPERTY_EVENT" :
                        "CHANNEL_DATA_PANELS_DRAGEND_PROPERTY_EVENT"
                    e.payload = payload;
                    return e;
                  }


              )


          )


        }))*/




    const dragMove$ = dragStart$.pipe(
        switchMap(
            (start)=> {
              let mouseMoveBool = true;
              const {propertyId} = start.payload;
              const {cmsId} = document.querySelector(`#${propertyId}`).dataset;
              const rootProxyId = UtilTraits.util$GetRootProxyId(cmsId);


              const mouseUpVsidFilter = new ChannelPayloadFilter({
                selector: `#${propertyId}`,
                action: v=>["CHANNEL_UI_MOUSEUP_EVENT"].includes(v)

              })
              const vsidUp$ = this.getChannel("CHANNEL_UI", mouseUpVsidFilter);

              return windowMove$.pipe(
                  mergeWith(vsidUp$),

                  takeWhile(()=>mouseMoveBool === true),

                  map(

                      (e) => {



              mouseMoveBool =  e.action !== "CHANNEL_UI_MOUSEUP_EVENT";
              //console.log("ACTION IS ",{mouseMoveBool,propertyId}, e.action);
              const {payload}   =        e.clone();
              payload['mouseMoveBool'] = mouseMoveBool;
              payload['rootProxyId'] = rootProxyId;
              payload['deltaY3'] =        (e.event.pageY - start.event.pageY)*1;
              payload['deltaY'] =        mouseMoveBool ? e.event.pageY - start.event.pageY : 0;
              payload['startOffsetY'] =  start.event.offsetY;
              payload['mouseX'] =        e.event.x;
              payload['mouseY'] =        e.event.y;
              payload['vsid']   =        start.payload.propertyId;
              payload['propertyId'] =   start.payload.propertyId;
              e.action = mouseMoveBool ?
                  "CHANNEL_DATA_PANELS_DRAGMOVE_PROPERTY_EVENT" :
                  "CHANNEL_DATA_PANELS_DRAGEND_PROPERTY_EVENT"
              e.payload = payload;
              return e;
            }


        )


    )


  }))

    const onNext = (e)=>{
    //  const {payload, action} = e;
     // const {mouseX,mouseY} = payload;


      const {payload, action, event, srcElement} = e;

     /*
      const {propertyId, rootProxyId, mouseMoveBool, deltaY} = payload;
      document.querySelector(`#${propertyId}`).style.transform = `translateY(${deltaY}px)`
      document.querySelector(`#${propertyId}`).style.zIndex =  mouseMoveBool ? "10000000" : "initial";*/

      //console.log("ENEXT ",{action,rootProxyId,mouseMoveBool,propertyId,deltaY,e, payload,event,srcElement})

      this.sendChannelPayload(action, payload, event, srcElement);
    }

    const onComplete = (e)=>{

      //console.log("ON COMPLETE ",e);
    }

    const onSubscribe = (e)=>{


    }

    dragMove$.subscribe(onNext);
   // const dragLast$ = dragMove$.pipe(last())

    //dragLast$.subscribe(onComplete);




  }

  static cmsPropControls$CreateOptionArray(data=this.props.data, isContainer = false){

    const {vsid, dataCmsId, parentDataId, dataCmsKey} = data;

    const rootProxyId = UtilTraits.util$GetRootProxyId(dataCmsId);

   //console.log("ThIS PROPS DATA PANEL PROP ",data);

    const reduceToPropData = (acc, o) => {

      let {title, icon, type, propertyType, isContainerOnly} = o;

      if (isContainerOnly===true && isContainer===false){
        return acc;
      }

      const activeElementId = vsid;
      let titleCta = type !== "convert" ? "" : isContainer === true ? "Add" : "Convert to";
      type = type === 'convert' && isContainer === true ? 'create' : type;
     // const titleCta = type === 'convert' && isContainer === true ? "Add" : "Convert";
      title =  `${titleCta} ${title}`;

      acc.push({activeElementId, vsid, isContainer, rootProxyId, parentDataId, propertyType, dataCmsId, dataCmsKey, type, title, icon})

      //console.log("PROPS ACC IS ",acc);

      return acc;

    }

    const basePropsArr = SpyneCmsPanelDataPropertyControlsTraits.cmsPropControls$GetBaseOptionsArray()

    return basePropsArr.reduce(reduceToPropData, []);

  }

  static cmsPropControls$GetBaseOptionsArray(){

    return [

      {
        title: "Prompt",
        icon: "prompt_suggestion",
        type: "prompt",
        propertyType: "none"
      },
      {
        title: "Copy",
        icon: "content_copy",
        type: "copy",
        propertyType: "none"
      },
      {
        title: "Paste",
        icon: "content_paste",
        type: "paste",
        propertyType: "none"
      },

      {
        title: "Delete",
        icon: "remove",
        type: "delete",
        propertyType: "none"
      },
      {
        title: "Duplicate",
        icon: "add",
        type: "duplicate",
        propertyType: "none"
      },
      {
        title: "String",
        icon: "abc",
        type: "convert",
        propertyType: "string"
      },
     /* {
        title: "Rich Text",
        icon: "format_shapes",
        type: "convert",
        propertyType: "HTML"
      },*/

      {
        title: "Number",
        icon: "123",
        type: "convert",
        propertyType: "number"
      },
      {
        title: "Boolean",
        icon: "rule",
        type: "convert",
        propertyType: "boolean"
      },
      {
        title: "Null",
        icon: "check_box_outline_blank",
        type: "convert",
        propertyType: "null"
      },
      {
        title: "Object",
        icon: "data_object",
        type: "convert",
        isContainerOnly: true,
        propertyType: "object"
      },
      {
        title: "Array",
        icon: "data_array",
        type: "convert",
        isContainerOnly: true,
        propertyType: "array"
      }

    ]



  }

  static cmsPropControls$HelloWorld(){
    return "Hello World";
  }

}

