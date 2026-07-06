import {ViewStream, ChannelPayloadFilter} from 'spyne';
import {SpyneCmsPanelTraits} from '../../../traits/spyne-cms-panel-traits';

export class CmsDataPanelTabView extends ViewStream {

    constructor(props={}) {
        props.traits = SpyneCmsPanelTraits;

        //console.log("CMS DATA TAB ",props);
       const {fileName, rootProxyId} = props.data;
       props.class=`cms-data-panel-tab ${rootProxyId}`;
       props.dataset = {};
      props['dataset']['rootId'] = rootProxyId;
      props['dataset']['type'] = 'cms-data-panel-active-ui';
      props['dataset']['uiType'] = 'cms-data-panel-tab';

      props.data.fileNameClean = SpyneCmsPanelTraits.spyneCmsPanel$FileNameOnly(fileName);

       props.template = require('./templates/cms-data-panel-tab.tmpl.html');

       //console.log("FILE NAME IS ",{fileName, rootProxyId})



      super(props);
    }

    addActionListeners() {
      const {rootProxyId} = this.props.data;

      // the pending payload is the first cms-item of a new batch; its cmsId
      // is prefixed with the owning panel's rootProxyId
      const pendingIsForThisPanelFilter = new ChannelPayloadFilter({
        payload: (v)=>String(v?.cmsId ?? '').startsWith(rootProxyId)
      });

        return [
          ['CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_PENDING_EVENT', 'onItemsPending', pendingIsForThisPanelFilter],
          ['CHANNEL_SPYNE_JSON_CMS_DATA_ITEMS_ACTIVATED_EVENT', 'onItemsActivated']
        ];
    }

    /**
     * LAZY-LOAD SPINNER: shown while this panel's cms-item batch is
     * buffering/materializing. Only lazy panels defer work, so eager panels
     * (which publish data-is-lazy="false") never spin.
     */
    onItemsPending(e){
      if (this.panelIsLazy() !== true){
        return;
      }
      this.showLoadingSpinner();
    }

    onItemsActivated(e){
      // any batch completion ends the burst; hiding respects the minimum
      // display time so this is safe even if the batch was not this panel's
      this.hideLoadingSpinner();
    }

    panelIsLazy(){
      const {rootProxyId} = this.props.data;
      const panelEl = document.querySelector(`.cms-data-panel.${rootProxyId}`);
      return panelEl?.dataset.isLazy === 'true';
    }

    showLoadingSpinner(){
      const spinnerEl$ = this.props.el$('.cms-data-panel-loading-spinner');
      if (spinnerEl$.exists === false){
        return;
      }
      window.clearTimeout(this.props.spinnerHideTimeout);
      this.props.spinnerShownAt = performance.now();
      spinnerEl$.el.classList.add('is-loading');
      // failsafe: never leave the spinner stuck if the batch never lands
      this.props.spinnerHideTimeout = window.setTimeout(()=>spinnerEl$.el.classList.remove('is-loading'), 5000);
    }

    hideLoadingSpinner(){
      const spinnerEl$ = this.props.el$('.cms-data-panel-loading-spinner');
      if (spinnerEl$.exists === false){
        return;
      }
      window.clearTimeout(this.props.spinnerHideTimeout);
      // enforce a minimum display time so short bursts read as a gentle
      // pulse instead of a one-frame flicker
      const minDisplayMs = 400;
      const elapsed = performance.now() - (this.props.spinnerShownAt ?? 0);
      const remainingMs = Math.max(0, minDisplayMs - elapsed);
      this.props.spinnerHideTimeout = window.setTimeout(()=>spinnerEl$.el.classList.remove('is-loading'), remainingMs);
    }

    broadcastEvents() {
        // return nexted array(s)
        return [
            ['.cms-data-panel-tab', 'click']
        ];
    }

    onRendered() {
      this.addChannel("CHANNEL_SPYNE_JSON_CMS_DATA");
    }

}
