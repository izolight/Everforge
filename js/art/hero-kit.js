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
    return result;
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
      await draw(manifest.clothing.torso);
      await draw(manifest.clothing.trousers);
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
  window.HeroKit={render,normalize,tinted,color};
})();
