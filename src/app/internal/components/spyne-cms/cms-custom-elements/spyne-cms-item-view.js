import {ViewStream, ChannelPayloadFilter} from 'spyne';

export class SpyneCmsItemView extends ViewStream {

    constructor(props={}) {

        super(props);
    }

    addActionListeners() {
      const {cmsKey, cmsId} = this.props.data;
      //console.log("cmsKey and ID is ",{cmsKey,cmsId})

      const cmsValuesUpdatedFilter = new ChannelPayloadFilter({
        cmsKey: cmsKey,
        cmsId: cmsId

      })

        // return nexted array(s)
        return [
            ["CHANNEL_SPYNE_JSON_CMS_DATA_UI_INPUT_CHANGED_EVENT", 'onInputUpdated', cmsValuesUpdatedFilter]
        ];
    }

    onInputUpdated(e){
      const {textVal} = e.payload;
      this.props.el$('spyne-cms-item-text').el.innerHTML = textVal;
      //console.log('on input updated is ',{textVal, e},this.props.el);


    }

    broadcastEvents() {
        // return nexted array(s)
        return [

            ['spyne-cms-item-hitbox', 'mouseover']

        ];
    }

    sendInfoToCmsChannel(payload, actionType="ADDED"){
        const action = `CHANNEL_SPYNE_JSON_CMS_DATA_ITEM_${actionType}`;
        const channelName = "CHANNEL_SPYNE_JSON_CMS_DATA"
        console.log("action is ",action);

       this.sendInfoToChannel(channelName, this.props.data, action);

    }



    onRendered() {
        this.sendInfoToCmsChannel();
        this.addChannel("CHANNEL_SPYNE_JSON_CMS_DATA_UI");
    }

}

