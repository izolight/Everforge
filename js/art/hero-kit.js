/* Registered raster appearance compositor. Equipment migration is a later batch. */
(() => {
  const images = new Map();
  function image(url) {
    if (!images.has(url)) images.set(url, new Promise((resolve, reject) => {
      const img = new Image(); img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Missing art: ${url}`)); img.src = url;
    }));
    return images.get(url);
  }
  const canvas = (w,h) => Object.assign(document.createElement('canvas'), {width:w,height:h});
  // Recipes accept palette names or CSS hex colors; store custom colors canonically.
  function hexColor(value) {
    if (typeof value !== 'string' || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return null;
    const hex=value.slice(1).toLowerCase();
    return '#'+(hex.length===3 ? [...hex].map(c=>c+c).join('') : hex);
  }
  function color(manifest, key, value) {
    return hexColor(value) || (Object.hasOwn(manifest.palettes[key],value) ? manifest.palettes[key][value] : null);
  }
  function normalize(manifest, recipe = {}) {
    const result = {...manifest.defaults, ...recipe};
    for (const key of ['face','hair']) if (!Object.hasOwn(manifest[key + 's'],result[key])) result[key] = manifest.defaults[key];
    for (const key of ['skin','eyes','hairColor']) {
      const custom=hexColor(result[key]);
      if (custom) result[key]=custom;
      else if (!Object.hasOwn(manifest.palettes[key],result[key])) result[key]=manifest.defaults[key];
    }
    const colors=normalizeColors(recipe.colors,['torso','trousers']);
    if(Object.keys(colors).length)result.colors=colors;else delete result.colors;
    return result;
  }
  function normalizeColors(raw, ids) {
    const result={};
    for(const id of ids){
      const input=raw?.[id];if(!input||typeof input!=='object')continue;
      const channels={};
      for(const channel of ['all','surface','trim']){
        const value=hexColor(input[channel]);
        if(value||input[channel]==='original')channels[channel]=value||'original';
      }
      if(Object.keys(channels).length)result[id]=channels;
    }
    return result;
  }
  // Any registered raster can use this path. Missing masks select visible pixels.
  // Every channel reads source luminance, so overlapping masks never compound tint.
  const parts=new Map();
  async function part(base, descriptor, colors={}, defaults={}) {
    const channels={...defaults,...colors},key=JSON.stringify([base,descriptor,channels]);
    if(parts.has(key))return parts.get(key);
    const pending=(async()=>{
      const source=await image(base+descriptor.src),layer=canvas(source.width,source.height),ctx=layer.getContext('2d');ctx.drawImage(source,0,0);
      if(!Object.values(channels).some(hexColor))return layer;
      const original=ctx.getImageData(0,0,layer.width,layer.height),pixels=ctx.getImageData(0,0,layer.width,layer.height);
      for(const channel of ['all','surface','trim']){
        const color=hexColor(channels[channel]),restore=channels[channel]==='original';if(!color&&!restore)continue;
        const maskFile=channel==='surface'?descriptor.mask:channel==='trim'?descriptor.trimMask:null;
        let selection;
        if(maskFile){const m=canvas(layer.width,layer.height),mx=m.getContext('2d');mx.drawImage(await image(base+maskFile),0,0);selection=mx.getImageData(0,0,m.width,m.height).data}
        // An absent trim mask means this asset has no separate trim channel.
        if(channel==='trim'&&!selection)continue;
        const weight=i=>selection?selection[i]/255*selection[i+3]/255:1;
        let sum=0,total=0;
        for(let i=0;i<original.data.length;i+=4){const w=weight(i)*original.data[i+3]/255;sum+=(.2126*original.data[i]+.7152*original.data[i+1]+.0722*original.data[i+2])*w;total+=w}
        const reference=(channel==='surface'&&descriptor.tintReferenceLuma)||sum/total||128;
        const rgb=color&&color.slice(1).match(/../g).map(v=>parseInt(v,16));
        for(let i=0;i<pixels.data.length;i+=4){const w=weight(i);if(!w||!original.data[i+3])continue;
          const l=.2126*original.data[i]+.7152*original.data[i+1]+.0722*original.data[i+2];
          for(let k=0;k<3;k++)pixels.data[i+k]=pixels.data[i+k]*(1-w)+(restore?original.data[i+k]:Math.min(255,rgb[k]*l/reference))*w;
        }
      }
      ctx.putImageData(pixels,0,0);return layer;
    })();
    // Bound memory when dragging a color picker across many custom colors.
    if(parts.size>=16)parts.delete(parts.keys().next().value);
    parts.set(key,pending);try{return await pending}catch(error){parts.delete(key);throw error}
  }
  async function tinted(url, maskURL, color, referenceLuma) {
    const source = await image(url), layer = canvas(source.width,source.height), ctx = layer.getContext('2d');
    ctx.drawImage(source,0,0);
    if (!color || !maskURL) return layer;
    const mask = canvas(source.width,source.height), mx = mask.getContext('2d');
    mx.drawImage(await image(maskURL),0,0);
    const pixels = ctx.getImageData(0,0,source.width,source.height), selection = mx.getImageData(0,0,source.width,source.height).data;
    const rgb = color.match(/\w\w/g).map(v => parseInt(v,16));
    // Use the original luminance as shading; preserve alpha, whites and unmasked detail.
    for (let i=0;i<pixels.data.length;i+=4) {
      const weight = selection[i]/255;
      if (!weight || !pixels.data[i+3]) continue;
      const luma = .2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2];
      for(let k=0;k<3;k++) pixels.data[i+k] = pixels.data[i+k]*(1-weight) + Math.min(255,rgb[k]*luma/referenceLuma)*weight;
    }
    ctx.putImageData(pixels,0,0); return layer;
  }
  async function render(target, manifest, rawRecipe = {}, baseURL = '../assets/hero/kit/', options = {}) {
    const recipe = normalize(manifest,rawRecipe), face = manifest.faces[recipe.face], hair = manifest.hairs[recipe.hair];
    target.width=manifest.canvas.width; target.height=manifest.canvas.height;
    const ctx=target.getContext('2d'); ctx.clearRect(0,0,target.width,target.height);
    const draw = async (asset,mask,color,referenceLuma) => ctx.drawImage(await tinted(baseURL+asset,mask ? baseURL+mask : null,color,referenceLuma),0,0);
    const skin=color(manifest,'skin',recipe.skin), hairColor=color(manifest,'hairColor',recipe.hairColor);
    if (hair.back && !options.hideHair) await draw(hair.back,hair.backMask,hairColor,manifest.tintReferenceLuma.hairColor);
    await draw(manifest.body,manifest.masks.skin,skin,manifest.tintReferenceLuma.skin);
    if (!options.hideUnderclothes) {
      for(const id of ['torso','trousers'])ctx.drawImage(await part(baseURL,{src:manifest.clothing[id]},recipe.colors?.[id]),0,0);
    }
    const faceLayer=await tinted(baseURL+face.src,baseURL+face.skinMask,skin,manifest.tintReferenceLuma.skin);
    // Eyes are independently masked, after the skin pass.
    const eyes=color(manifest,'eyes',recipe.eyes);
    if (eyes) {
      const tempURL=faceLayer.toDataURL();
      ctx.drawImage(await tinted(tempURL,baseURL+face.eyeMask,eyes,manifest.tintReferenceLuma.eyes),0,0);
      images.delete(tempURL);
    } else ctx.drawImage(faceLayer,0,0);
    if (!options.hideHair) await draw(hair.front,hair.mask,hairColor,manifest.tintReferenceLuma.hairColor);
    return recipe;
  }
  window.HeroKit={render,normalize,tinted,color,hexColor,normalizeColors,part};
})();
