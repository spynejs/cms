import {ViewStream} from 'spyne';
import {SpyneCmsItem} from './spyne-cms-item';

/**
 * Null-appended relay: SpyneCmsItem custom elements cannot send to channels,
 * so their connectedCallback dispatches a window CustomEvent that this
 * ViewStream forwards to CHANNEL_SPYNE_JSON_CMS_DATA as ITEM_ADDED events.
 * The channel buffers those (bufferTime) and emits
 * CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_ACTIVATED_EVENT with the batch, which
 * lazy data panels use to materialize only the sections present on the page.
 */
export class SpyneCmsItemsRelay extends ViewStream {

  constructor(props={}) {
    props.id = 'spyne-cms-items-relay';
    super(props);
  }

  onRendered() {
    this.addChannel("CHANNEL_SPYNE_JSON_CMS_DATA");

    const onItemConnected = (e)=>{
      const action = "CHANNEL_SPYNE_JSON_CMS_DATA_ITEM_ADDED";
      this.sendInfoToChannel("CHANNEL_SPYNE_JSON_CMS_DATA", e.detail, action);
    };

    window.addEventListener(SpyneCmsItem.connectedEventName, onItemConnected);
  }

}
