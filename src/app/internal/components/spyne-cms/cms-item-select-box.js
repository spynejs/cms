import {ViewStream} from 'spyne';
import {CmsSelectItemBoxTraits} from '../../traits/cms-select-item-box.traits';

export class CmsItemSelectBox extends ViewStream {

    constructor(props={}) {
        props.id="cms-item-select-box";
        props.traits=CmsSelectItemBoxTraits;

        props.template = require("./templates/cms-item-select-box.tmpl.html");
        super(props);
    }

    addActionListeners() {
        // return nexted array(s)
        return [
          ["CHANNEL_SPYNE_JSON_CMS_DATA_UI_FOCUS_EVENT", "onItemFocused"],
              ["CHANNEL_CMS_ITEMS_FOCUS_EVENT", "onItemFocused"],
            ["CHANNEL_CMS_ITEMS_BLUR_EVENT", "onBlurEvent"],
            ["CHANNEL_DATA_PANELS_ITEM_DELETED_PROPERTY", "onItemDeletedEvent"]
        ];
    }

    /**
     * If the highlight is parked on an item whose panel row was just
     * deleted, the item is now display:none — blur rather than float over
     * nothing.
     */
    onItemDeletedEvent(e){

      const {deletedCmsId, deletedCmsKey, deletedIsContainer, deletedCmsIdsArr} = e.payload;
      const {cmsId, cmsKey} = this.props.el.dataset;

      const isDeleted = deletedIsContainer === true ?
          (deletedCmsIdsArr || []).includes(cmsId) :
          cmsId === deletedCmsId && cmsKey === deletedCmsKey;

      if (isDeleted === true){
        this.onBlurEvent(e);
      }

    }

    onBlurEvent(e){
      this.props.el$.removeClass('focused');
    }

    onItemFocused(e){

      const {payload, srcElement} = e;
      const {cmsKey, cmsId, rectBox, textVal} = payload;
      const {el} = srcElement;
      //console.log('on item focused ',{cmsKey, cmsId, el,payload, srcElement});

      if (textVal === undefined) {
        this.props.el.dataset['cmsId'] = cmsId;
        this.props.el.dataset['cmsKey'] = cmsKey;
      } else if (cmsId!==this.props.el.dataset['cmsId'] && cmsKey !== this.props.el.dataset['cmsKey']){
        this.onBlurEvent(e);
        return;
      }
      this.props.el$.addClass('focused');

      this.cmsSelectItem$SetClientRect(rectBox);
    }

    broadcastEvents() {
        // return nexted array(s)
        return [];
    }

    onRendered() {
        this.addChannel("CHANNEL_SPYNE_JSON_CMS_DATA_UI");
        this.addChannel("CHANNEL_CMS_ITEMS");
        this.addChannel("CHANNEL_DATA_PANELS");
    }

}

