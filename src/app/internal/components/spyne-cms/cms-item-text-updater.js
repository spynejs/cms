import {ViewStream} from 'spyne';
import {CmsSelectItemBoxTraits} from '../../traits/cms-select-item-box.traits';

export class CmsItemTextUpdater extends ViewStream {

    constructor(props={}) {
      // THIS IS A NULL APPENDED ITEM THAT CHECKS DOCUMENT FOR ANY INPUT MATCHED CMS ITEMS

        super(props);
    }

    addActionListeners() {
        // return nexted array(s)
        return [
            ["CHANNEL_CMS_ITEMS_FOCUS_EVENT", "onCmsItemsUpdatedEvent"],
            ["CHANNEL_DATA_PANELS_ITEM_DELETED_PROPERTY", "onCmsItemDeletedEvent"]
        ];
    }

    /**
     * The app only re-renders cms items on publish, so when a panel row is
     * deleted its items would linger as interactive stale targets. Marking
     * them cms-item-deleted (display:none) makes the deletion immediate in
     * the app: for containers every cmsId in the deleted subtree hides; for
     * primitives only the exact cmsId + cmsKey pair.
     */
    onCmsItemDeletedEvent(e){

      const {deletedCmsId, deletedCmsKey, deletedIsContainer, deletedCmsIdsArr} = e.payload;

      if (deletedCmsId === undefined){
        return;
      }

      const itemsArr = deletedIsContainer === true ?
          CmsSelectItemBoxTraits.cmsSelectItem$GetItemsByCmsIds(deletedCmsIdsArr) :
          Array.from(CmsSelectItemBoxTraits.cmsSelectItem$GetSelectedItems(deletedCmsId, deletedCmsKey));

      CmsSelectItemBoxTraits.cmsSelectItem$MarkItemsDeleted(itemsArr);

    }

    onCmsItemsUpdatedEvent(e){

      const {textUpdated, textVal, cmsId, cmsKey} = e.payload;

      const itemsEl = CmsSelectItemBoxTraits.cmsSelectItem$GetSelectedItems(cmsId, cmsKey);

      //console.log('items el is ',{itemsEl, textVal})

      if(textVal!==undefined){
         CmsSelectItemBoxTraits.cmsSelectItem$UpdateCmsItems(Array.from(itemsEl), textVal);
      }



    }

    broadcastEvents() {
        // return nexted array(s)
        return [];
    }

    onRendered() {
      //console.log('text updater added ',this.props.el);
      this.addChannel("CHANNEL_CMS_ITEMS");
      this.addChannel("CHANNEL_DATA_PANELS");
    }

}

