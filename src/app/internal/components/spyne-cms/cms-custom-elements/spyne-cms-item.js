import {SpyneCmsItemView} from './spyne-cms-item-view';

export class SpyneCmsItem extends HTMLElement{


  constructor() {
      //console.log("cfreated spyne cms item element");
    super();
     //requestAnimationFrame(this.addSvgRect.bind(this));
  }

  addSvgRect(){


    const shadow = this.attachShadow({mode: 'open'});
    const svgns = "http://www.w3.org/2000/svg";

    const spanTxt = document.createElement('span');
    spanTxt.textContent = this.textContent;
    this.textContent = "";

    const svg = document.createElementNS(svgns, 'svg');

    svg.setAttribute('viewbox', "0 0 100% 100%");
    svg.setAttribute('xmlns', "http://www.w3.org/2000/svg")

    const svgBtn = document.createElementNS(svgns, 'text');
    svgBtn.textContent = "✎";
    svgBtn.setAttribute("x", "8");
    svgBtn.setAttribute("y", "8");

   // svg.appendChild(svgBtn);
    shadow.appendChild(spanTxt);
    shadow.appendChild(svg);
    const rect = document.createElementNS(svgns, 'rect');

   // const rect = document.createElement('rect');
    //rect.setAttribute("x", "-2");
    //rect.setAttribute("y", "-2");
   // rect.setAttribute("width", "100");
   // rect.setAttribute("class", "stroked");
   // rect.setAttribute("height", "100");
   const onFrame = ()=>{
     svg.appendChild(rect);
    // rect.styles.classList.add('stroked');

   }

    requestAnimationFrame(onFrame);


    let style = document.createElement('style');
    style.textContent = SpyneCmsItem.getStylesText();
    shadow.appendChild(style);

    //onFrame();
    //this.attachShadow({mode: 'closed'});

  }


  addBorderSpan(){
    const borderSpan = document.createElement('span');
    this.appendChild(borderSpan);

  }

  addSpanBtn(){
    //const spanBtn = document.createElement('span');
    //this.appendChild(spanBtn);

    const spanBtn = this.querySelector('span');
    spanBtn.style.cssText='position:absolute; opacity:.4; cursor:pointer; pointer-events:all; background:orange; height: 30px; max-height:80%; min-height:30px; width:30px; max-width:50%;';

    spanBtn.dataset['cmsId'] = this.dataset['cmsId'];
    spanBtn.dataset['cmsKey'] = this.dataset['cmsKey'];




  }

  updateStyle(elem) {
    //console.log("update style ",elem);
    const shadow = elem.shadowRoot;
    shadow.querySelector('style').textContent = `
    div {
      width: ${elem.getAttribute('l')}px;
      height: ${elem.getAttribute('l')}px;
      background-color: ${elem.getAttribute('c')};
    }
  `;
  }


  addCmsHitbox(){
    //const spanBtn = document.createElement('span');
    //this.appendChild(spanBtn);

/*    const spanBtn = this.querySelector('span');
    spanBtn.style.cssText='position:absolute; opacity:.4; cursor:pointer; pointer-events:all; background:orange; height: 30px; max-height:80%; min-height:30px; width:30px; max-width:50%;';

    spanBtn.dataset['cmsId'] = this.dataset['cmsId'];
    spanBtn.dataset['cmsKey'] = this.dataset['cmsKey'];*/
    const hitBox = this.querySelector('spyne-cms-item-hitbox');
    //const hitBox = document.createElement('spyne-cms-item-hitbox');
    //this.appendChild(hitBox);
   // hitBox.style.cssText = "position:absolute; opacity:.4; cursor:pointer; pointer-events:all; background:orange; height: 30px; max-height:80%; min-height:30px; width:30px; max-width:50%;";

    hitBox.dataset['cmsId'] = this.dataset['cmsId'];
    hitBox.dataset['cmsKey'] = this.dataset['cmsKey'];
  }


  connectedCallback(e){
    const {dataset} = this;
    const {cmsId, origKey, cmsKey} = dataset;
    const text = this.innerText;
    const data = {cmsId, origKey, cmsKey, text};

    // custom elements cannot sendInfoToChannel; CHANNEL_WINDOW captures this
    // CustomEvent (config.channels.WINDOW.customEvents) and conforms it as
    // CHANNEL_WINDOW_SPYNE_CMS_ITEM_CONNECTED_EVENT, which
    // ChannelSpyneJsonCmsData acquires and batches into ITEMS_ACTIVATED
    window.dispatchEvent(new CustomEvent(SpyneCmsItem.connectedEventName, {detail: data}));

  }

  static get connectedEventName(){
    return 'spyne_cms_item_connected';
  }

  /**
   * The exact config.channels.WINDOW.customEvents entry host apps should
   * declare: CHANNEL_WINDOW closes a batch 400ms after the last item connects
   * and emits ONE payload per render burst (payload.detail = details array).
   */
  static get connectedEventConfig(){
    return {name: SpyneCmsItem.connectedEventName, buffer: 400};
  }



  connectedCallback1(e){
    const {dataset} = this;
    const {cmsId, origKey, cmsKey} = dataset;
    const text = this.innerText;
    const data = {cmsId, origKey, cmsKey, text};
   // this.sendInfoToCmsChannel(payload);
   // this.addSvgRect();
    //requestAnimationFrame(this.addSvgRect.bind(this));
  //  this.addSpanBtn();
    this.addCmsHitbox();
   // this.style.cssText="position:relative;display:inline-block;";
   /* const el = this;
    this.viewStream = new SpyneCmsItemView({
      el, data
    })*/
  }

  disconnectedCallback1() {
    this.viewStream.disposeViewStream();
  }

  static getStylesText(){
    return `  svg{
    position: absolute;;

    width: calc(100% + 0px);
    height: calc(100% + 0px);

    pointer-events: auto;
    cursor: pointer;
    display: inline-block;;
    background: rgba(123,123,222,0);
    //border:1px solid green;

    }
    
    svg text{
      width: 30px;
      height: 30px;
      color: #000;
      font-size: 10px;
      background:orange;
    }
    
    rect {
      stroke-width:2px;
      stroke: rgba(0,0,0,0);
      fill:none;;
      width: 100%;
      height: 100%;
    }
    
    rect:hover{
      stroke: skyblue;
     fill: rgba(123,123,222,.1);
    }
    
`

  }



}
