import {take} from 'rxjs/operators';
import {Channel, ChannelPayloadFilter, ChannelFetchUtil, SpyneAppProperties} from 'spyne';

export class ChannelSpyneJsonCmsData extends Channel{

  constructor(name, props={}) {
    name="CHANNEL_SPYNE_JSON_CMS_DATA";
    props.sendCachedPayload = false;
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

    /**
     * SpyneCmsItem.connectedCallback dispatches a window CustomEvent that
     * CHANNEL_WINDOW captures AND batches — hosts declare
     * SpyneCmsItem.connectedEventConfig ({name: 'spyne_cms_item_connected',
     * buffer: 400}) in config.channels.WINDOW.customEvents, so ONE payload
     * arrives per render burst with payload.detail as the details array.
     * A host that declares the plain string name instead degrades
     * gracefully: each unbatched payload is treated as a burst of one.
     */
    const cmsItemConnectedFilter = new ChannelPayloadFilter({
      action: "CHANNEL_WINDOW_SPYNE_CMS_ITEM_CONNECTED_EVENT"
    });

    this.getChannel("CHANNEL_WINDOW", cmsItemConnectedFilter)
        .subscribe(this.onCmsItemsBatchReturned.bind(this));

  }

  onCmsItemsBatchReturned(e){
    const {detail, isBatch} = e.payload;
    const itemsArr = isBatch === true ? detail : [detail];

    if (itemsArr.length === 0){
      return;
    }

    this.onCmsItemsBurstStarted(itemsArr[0]);
    this.onCMSDataItemsRendered(itemsArr);
  }

  onCmsItemsBurstStarted(item){
    // lazy data panel tabs show their loading spinner until ITEMS_ACTIVATED lands
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_PENDING_EVENT";
    this.sendChannelPayload(action, item);
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


  onCmsItemRemoved(e){
    const {payload} = e;
    //console.log("the spyne cms item payload REMOVED is ",payload);

  }

  onCMSDataItemsRendered(itemsArr){
    // payload is the batch of cms items just loaded (one burst)
    const action = "CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_ACTIVATED_EVENT";
    this.sendChannelPayload(action, itemsArr);
  }

  addRegisteredActions() {

    return [
      ['CHANNEL_SPYNE_JSON_CMS_DATA_MANAGE_CMS_DATA_EVENT', 'onManageCmsData'],
      'CHANNEL_SPYNE_JSON_CMS_DATA_ITEM_ADDED',
      ['CHANNEL_SPYNE_JSON_CMS_DATA_ITEM_REMOVED', 'onCmsItemRemoved'],
      'CHANNEL_SPYNE_JSON_CMS_DATA_ADDED_EVENT',
      'CHANNEL_SPYNE_JSON_CMS_DATA_CONFORM_PUBLISHED_DATA_EVENT',
      ['CHANNEL_SPYNE_JSON_CMS_DATA_CONFORMED_PANEL_DATA_EVENT', 'onCmsDataPublishConformed'],
        'CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_ACTIVATED_EVENT',
        'CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_PENDING_EVENT'
    ];
  }

  onViewStreamInfo(obj) {
    let data = obj.props();
  }

}

