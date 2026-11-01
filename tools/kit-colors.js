/* Shared workbench controls. Color recipes are plain JSON, separate from game saves. */
window.KitColors={
  palette(host,id,label,palette,get,set,update){
    const wrap=document.createElement('label');wrap.textContent=label;
    const select=document.createElement('select');select.id=id;select.setAttribute('aria-label',label);
    for(const name of Object.keys(palette))select.add(new Option(name,name));select.add(new Option('Custom…','custom'));
    const picker=document.createElement('input');picker.type='color';picker.id=id+'Custom';picker.setAttribute('aria-label','Custom '+label);
    function sync(){const value=get();select.value=Object.hasOwn(palette,value)?value:'custom';picker.value=HeroKit.hexColor(value)||palette[value]||'#808080'}
    select.onchange=()=>{set(select.value==='custom'?picker.value:select.value);sync();update()};
    picker.oninput=()=>{set(picker.value);sync();update()};sync();wrap.append(select,picker);host.append(wrap);return sync;
  },
  parts(host,label,parts,get,set,update){
    const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=label;details.append(summary);
    const hint=document.createElement('p');hint.textContent='Colors apply when this part is equipped or its upgrade is enabled. Whole part replaces group dyes; surface and trim refine it. Choose Inherit to use shared dyes again.';details.append(hint);
    const form=document.createElement('div');form.className='controls';details.append(form);
    const wrap=document.createElement('label');wrap.textContent='Part';const select=document.createElement('select');select.setAttribute('aria-label',label+' part');
    for(const [id,descriptor]of Object.entries(parts))select.add(new Option(descriptor.label||id,id));wrap.append(select);form.append(wrap);
    const rows=[];
    for(const channel of ['all','surface','trim']){
      const row=document.createElement('label');row.textContent={all:'Whole part',surface:'Surface',trim:'Trim'}[channel];
      const mode=document.createElement('select');mode.setAttribute('aria-label',label+' '+channel+' mode');
      for(const [value,text]of [['inherit','Inherit'],['original','Original'],['custom','Custom…']])mode.add(new Option(text,value));
      const picker=document.createElement('input');picker.type='color';picker.setAttribute('aria-label',label+' '+channel+' color');
      const apply=()=>{const colors={...(get()||{})},part={...colors[select.value]};if(mode.value==='inherit')delete part[channel];else part[channel]=mode.value==='original'?'original':picker.value;
        if(Object.keys(part).length)colors[select.value]=part;else delete colors[select.value];set(colors);update()};
      mode.onchange=apply;picker.oninput=()=>{mode.value='custom';apply()};
      row.append(mode,picker);form.append(row);rows.push({channel,row,mode,picker});
    }
    function sync(){const descriptor=parts[select.value];for(const {channel,row,mode,picker}of rows){row.hidden=channel==='trim'&&!descriptor.trimMask;const value=get()?.[select.value]?.[channel];mode.value=value==='original'?'original':HeroKit.hexColor(value)?'custom':'inherit';picker.value=HeroKit.hexColor(value)||'#808080'}}
    select.onchange=sync;sync();host.append(details);return sync;
  }
};
