import {Subject, bufferTime, debounceTime} from 'rxjs';
import {takeWhile, takeUntil, take, switchMap, isEmpty, filter} from 'rxjs/operators';
import {Channel, ChannelPayloadFilter, ChannelFetchUtil, SpyneAppProperties} from 'spyne';

export class ChannelSpyneJsonCmsData extends Channel{

  constructor(name, props={}) {
    name="CHANNEL_SPYNE_JSON_CMS_DATA";
    props.sendCachedPayload = false;
    props.resetItemsListener = true;
    props.submitPanelIdsArr = [];
    props.publishDataFilesArr = [];
    super(name, props);
  }

  onRegistered(){

    const cmsDataPanelUIFilter = new ChannelPayloadFilter({
      action: "CHANNEL_SPYNE_JSON_CMS_DATA_UI_SUBMIT_DATA_EVENT"
    })

    this.getChannel("CHANNEL_SPYNE_JSON_CMS_DATA_UI", cmsDataPanelUIFilter)
        .subscribe(this.onBeginPublishDataEvent.bind(this));

    /** TODO: create custom rxjs that does
     * 1. listens to CHANNEL_ROUTE via getChannel with a timer and collects all customEvents using fromEvents from
     * SpyneCmsItem.connectedCallback src/app/internal/components/spyne-cms/cms-custom-elements/spyne-cms-item.js:115
     * and then runs onCMSDataItemsRendered
     */


  }

  onBeginPublishDataEvent(e){
    const {payload} = e;
    const {submitPanelIdsArr} = payload;
    this.props.submitPanelIdsArr = submitPanelIdsArr;
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_CONFORM_PUBLISHED_DATA_EVENT";
    this.sendChannelPayload(action, payload);

  }

  sendPublishedData(){

    try{
      const cmsPort = SpyneAppProperties.getProp("CMS_PORT");
      const url = `http://localhost:${cmsPort}/update`

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "text/plain");
      const bodyRaw = JSON.stringify(this.props.publishDataFilesArr);

      const requestOptions = {
        url,
        method: 'POST',
        header: "Content-Type, text/plain",
        body: bodyRaw
      };

      const onFetchSend = (e)=> console.log('fetch util is ',bodyRaw);
     // onFetchSend();

      new ChannelFetchUtil(requestOptions, onFetchSend)




    } catch(e){
      console.log('fetch err is ',e);
    }



  }

  onCmsDataPublishConformed(e){


    const {payload} = e;
    const {rootProxyId, publishDataObj } = payload;

    this.props.publishDataFilesArr.push(publishDataObj);

    if (this.props.publishDataFilesArr.length === this.props.submitPanelIdsArr.length){

      //console.log(this.props.publishDataFilesArr," SEND PUBLISHED COFORMED DATA", {rootProxyId, publishDataObj, payload});

      this.sendPublishedData();
    }


  }

  onCmsDataReturned(e){
    const {payload} = e;
    //console.log('data returned is ',{payload},payload.__cms__rootData);
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_ADDED_EVENT";
    this.sendChannelPayload(action, payload);

  }

  getCmsData(channelName){
    this.getChannel(channelName)
    .pipe(take(1))
    .subscribe(this.onCmsDataReturned.bind(this));
  }



  onManageCmsData(e){
    const {payload} = e;
    const {cmsChannelName} = e.payload;
    this.getCmsData(cmsChannelName);
  }


  onItemsEvent(payload){
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_ACTIVATED_EVENT";
    this.sendChannelPayload(action ,payload);
  }

  createSpyneCmsItemObs(){
    const item$ = new Subject();
    return item$.pipe(
        bufferTime(500),
        takeWhile((arr)=>{
          const bool = arr.length>0
          this.props.resetItemsListener = !bool;
          return bool;

        })
    )

  }



  onResetItemsObservable(){
    this.props.spyneCmsItems$ = this.createSpyneCmsItemObs();
    this.props.spyneCmsItems$.subscribe(this.onItemsEvent.bind(this));

  }



  onCmsItemAdded(e){
    const {payload} = e;

    if(this.props.resetItemsListener === true){
      this.onResetItemsObservable();
      this.props.resetItemsListener = false;
    }


    this.props.spyneCmsItems$.next(payload);

    //console.log("the spyne cms item payload ADDED is ",payload);

  }


  onCmsItemRemoved(e){
    const {payload} = e;
    //console.log("the spyne cms item payload REMOVED is ",payload);

  }
  onCMSDataItemsRendered(e){
    // returns payload of all recent cms items just loaded
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_ACTIVATED_EVENT";
    //this.sendChannelPayload(action, payload)
  }

  addRegisteredActions() {

    return [
      ['CHANNEL_SPYNE_JSON_CMS_DATA_MANAGE_CMS_DATA_EVENT', 'onManageCmsData'],
      ['CHANNEL_SPYNE_JSON_CMS_DATA_ITEM_ADDED', 'onCmsItemAdded'],
      ['CHANNEL_SPYNE_JSON_CMS_DATA_ITEM_REMOVED', 'onCmsItemRemoved'],
      'CHANNEL_SPYNE_JSON_CMS_DATA_ADDED_EVENT',
      'CHANNEL_SPYNE_JSON_CMS_DATA_CONFORM_PUBLISHED_DATA_EVENT',
      ['CHANNEL_SPYNE_JSON_CMS_DATA_CONFORMED_PANEL_DATA_EVENT', 'onCmsDataPublishConformed'],
        'CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_ACTIVATED_EVENT'
    ];
  }

  onViewStreamInfo(obj) {
    let data = obj.props();
  }

}

