import {SpyneApp, SpyneTrait} from 'spyne';
import {isNil, isEmpty, either, clone, flatten} from 'ramda';
import { gunzipSync } from "fflate";

export class UtilTraits extends SpyneTrait {

  constructor(context) {
    let traitPrefix = 'util$';
    super(context, traitPrefix);

  }

  static util$GetRootProxyIdRE(){
    return  /^(cms-\d{8}-)([01]+)(\d+)$/;
  }

  static util$GetRootProxyId(cmsId){
    const cmsIdRE = UtilTraits.util$GetRootProxyIdRE();
    const matchArr = String(cmsId).match(cmsIdRE);
    return matchArr[1] !== undefined ?  matchArr[1] : undefined;
  }

  static util$DecodeBase64(base64){
   //console.log('base 64 is ',base64);
    try {
      const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const unzipped = gunzipSync(binary);
      return new TextDecoder().decode(unzipped);
    } catch (err) {
      console.error("❌ Failed to decode EDET:", err);
      return null;
    }

  }


  static util$ToKebabCase (str){
    return str && str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    .map(x=>x.toLowerCase())
    .join('-');
  };

  static util$CamelToSnakeCase(str){
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  }


  static util$KebabToCamelCase(str){
    if (str.indexOf('-')<0){
      return str;
    }

    return str.toLowerCase().replace(/-(.)/g, function(match, group1) {
      return group1.toUpperCase();
    });
  }

  static async util$CopyToClipboard(text){
    try {
      await navigator.clipboard.writeText(text);
     //console.log('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  static util$GetRandInt(max, min=0){
    let maxNum = max-min+1;
    return Math.floor(Math.random()*maxNum)+min;
  }

  static util$SelectRandFromArr(arrSrc, amt=1){
    const arr = clone(arrSrc);
    let iter = 0;
    let len,n;
    let splicedArr = []
    while (iter<amt){
      len = arr.length-1;
      // select start splice
      n = Math.floor(Math.random()*len+1);
      //push slice item into new arr -- cant be duped
      splicedArr.push(arr.splice(n, 1))
      iter++;
    }

    return flatten(splicedArr);
  }

  static util$ScrollLock(el, bool=true){
    const fn = bool ? SpyneApp.pluginsFn.enableScrollLock : SpyneApp.pluginsFn.disableScrollLock;
    fn(el, bool);
  }


  static util$CreateId(){
    return Math.random().toString(36).replace(/\d/gm, '').substring(1,8);
  }

  static util$HashString(str){
    // FNV-1a 32-bit — fast, stable content hash for change detection
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++){
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
  }


  static util$checkForDeeplink(routeData){
    const expandCard = (page, card) =>{
      const {pageId, cardId} = this.props.data;
      return page===pageId && card === cardId;
    }
    const {pageId, cardId} = routeData;
    return expandCard(pageId, cardId);
  }

  static util$GetOffsetTop(props = this.props){
    const pageContentEl = document.querySelector('.app-page .page-content');
    const pageContentTop = pageContentEl.offsetTop;
    const top = this.props.el.offsetTop + pageContentTop+(16*8);
    return top;
  }

  static util$SetRootVal(key, val){
    document.documentElement.style.setProperty(key, val);
  }

  static util$GetRootVal(rootKey){
    return getComputedStyle(document.documentElement)
    .getPropertyValue('rootKey')

  }

  static util$GetIsPlainText(str=''){
    if (!str || typeof str !== 'string') return true;

    const trimmed = str.trim();

    // Matches any valid opening and closing XML/HTML tag pair
    const tagPattern = /^<([A-Za-z][A-Za-z0-9:_-]*)(\s[^>]*)?>[\s\S]*<\/\1>$/;

    // Returns true if string does NOT start and end with a tag
    return !tagPattern.test(trimmed);

  }


  static util$GetTemplate(name, filesArr){
    const cache = {};
    const importAll = (r) => r.keys().forEach(key => cache[key] = r(key));
    importAll(filesArr);
    let file =  cache[`./${name}.page.tmpl.html`]
    return file !== undefined ? file : cache[`./page.tmpl.html`];
  }


  static util$Exists(item){
    return !either(isNil, isEmpty)(item);
  }

  static util$GetType(prp){
    let type = typeof prp;
    if (['number', 'boolean', 'string'].includes(type)){
      type = 'primitive';
    } else if (type==='object'){
      if (Array.isArray(prp)){
        type = 'array'
      } else if (prp===null){
        type = 'undefined';
      }
    }
    return type;
  }

  static async util$ReadClipboardAndExtractValue() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        throw new Error("Clipboard is empty.");
      }

      // 1. Try to extract fenced JSON block
      const jsonMatch = text.match(/```json([\s\S]*?)```/i);
      if (jsonMatch) {
        const rawJson = jsonMatch[1].trim();
        return JSON.parse(rawJson);
      }

      // 2. Try to extract fenced STRING block
      const stringMatch = text.match(/```(?:txt|text|string)([\s\S]*?)```/i);
      if (stringMatch) {
        return stringMatch[1].trim();
      }

      // 3. Try plain JSON (user may paste only the object)
      try {
        return JSON.parse(text);
      } catch (err) {
        // Not JSON — continue to next step.
      }

      // 4. Plain text fallback
      return text.trim();

    } catch (err) {
      console.error("Clipboard extraction error:", err);
      throw new Error("Could not extract JSON or STRING from clipboard.");
    }
  }


  static util$CoerceValueToType(rawValue, expectedType) {
   // const trimmed = String(rawValue).trim();

    const handlers = {
      object(value) {
        try {
         //console.log("OBJ VAL ",{value})
          return JSON.stringify(value);
        }
        catch { throw new Error("Invalid JSON for type: object"); }
      },

      array(value) {
        try { return JSON.stringify(value); }
        catch { throw new Error("Invalid JSON for type: array"); }
      },

      number(value) {
        const num = Number(value);
        if (isNaN(num)) throw new Error("Invalid number");
        return num;
      },

      boolean(value) {
        const lower = value.toLowerCase();
        if (lower === "true") return true;
        if (lower === "false") return false;
        throw new Error("Invalid boolean (expected 'true' or 'false')");
      },

      string(value) {
        return value;
      }
    };

   //console.log("HANDLERS ",{rawValue, expectedType})

    // fallback to STRING (the universal base type)
    const handler = handlers[expectedType] || handlers.string;

    return handler(rawValue);
  }

}
