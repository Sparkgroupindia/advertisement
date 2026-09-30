let token=localStorage.getItem('vigyapan_admin_token')||'';
let DB={};
const $=s=>document.querySelector(s);
const api=()=>String(window.VIGYAPAN_CONFIG?.API||'').trim();

function esc(s=''){return String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/'/g,'&#39;')}
function showToast(t,type=''){const e=$('#toast');e.textContent=t;e.className=type?type:'';e.style.display='block';clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.style.display='none',2800)}
function jsonp(url){
  return new Promise((resolve,reject)=>{
    const cb='a_'+Date.now()+Math.random().toString(16).slice(2);
    const s=document.createElement('script');
    const to=setTimeout(()=>{s.remove();delete window[cb];reject(Error('Request timeout'))},15000);
    window[cb]=d=>{clearTimeout(to);s.remove();delete window[cb];resolve(d)};
    s.onerror=()=>{clearTimeout(to);s.remove();delete window[cb];reject(Error('API error'))};
    s.src=url+(url.includes('?')?'&':'?')+'callback='+cb;
    document.body.appendChild(s);
  })
}
async function post(body){
  if(!api())throw Error('Apps Script URL missing');
  const payload=JSON.stringify({...body,token});
  // text/plain avoids browser CORS preflight with Google Apps Script.
  await fetch(api(),{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:payload});
  await new Promise(r=>setTimeout(r,700));
  return {ok:true};
}
async function login(){
  try{
    const p=$('#password').value;
    if(!p)return showToast('Enter admin password');
    const d=await jsonp(api()+'?action=login&password='+encodeURIComponent(p));
    if(!d.ok)return showToast(d.error||'Invalid password','error');
    token=d.token;localStorage.setItem('vigyapan_admin_token',token);start();
  }catch(e){showToast('Apps Script connection failed','error')}
}
function logout(){localStorage.removeItem('vigyapan_admin_token');token='';location.reload()}
async function start(){
  if(!token)return;
  try{
    const d=await jsonp(api()+'?action=authCheck&token='+encodeURIComponent(token));
    if(!d.ok)throw Error('Session expired');
    $('#login').classList.add('hidden');$('#app').classList.remove('hidden');
    await load();bindTabs();renderDashboard();
  }catch(e){
    localStorage.removeItem('vigyapan_admin_token');token='';
    showToast('Session expired. Please login again','error');
  }
}
async function load(){const d=await jsonp(api()+'?action=public');if(!d||!d.version)throw Error('CMS data unavailable');DB=d}
async function refresh(msg){
  try{await new Promise(r=>setTimeout(r,650));await load();if(msg)showToast(msg)}
  catch(e){showToast('Saved, but refresh failed. Reload CMS once.','error')}
}
function bindTabs(){
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');renderTab(b.dataset.tab);
    if(innerWidth<800)toggleSide();
  });
}
function toggleSide(){document.querySelector('aside').classList.toggle('open')}
function renderDashboard(){
  const activeCount=k=>(DB[k]||[]).filter(x=>String(x.active).toUpperCase()==='YES').length;
  $('#content').innerHTML=`<div class="pageHead"><div><div class="eyebrow">MASTER CONTROL</div><h1>Website Dashboard</h1><p>Manage every public section, media file and setting from one place.</p></div><div class="headActions"><a class="btn gold" href="index.html" target="_blank">View Live Website ↗</a></div></div>
  <div class="welcome panel"><div><b>VIGYAPAN CMS</b><span>Live website control center</span></div><div class="liveDot"><i></i> CMS Connected</div></div>
  <div class="stats">
    <div class="stat"><span>HERO</span><b>${activeCount('hero')}</b><small>active slides</small></div>
    <div class="stat"><span>SERVICES</span><b>${activeCount('services')}</b><small>visible services</small></div>
    <div class="stat"><span>PRODUCTS</span><b>${activeCount('products')}</b><small>visible products</small></div>
    <div class="stat"><span>PLANS</span><b>${activeCount('plans')}</b><small>published plans</small></div>
    <div class="stat"><span>GALLERY</span><b>${activeCount('gallery')}</b><small>published media</small></div>
    <div class="stat"><span>TESTIMONIALS</span><b>${activeCount('testimonials')}</b><small>published reviews</small></div>
  </div>
  <div class="quickGrid">
    <button onclick="goTab('settings')"><strong>⚙</strong><span>Brand & Settings</span><small>Logo, contact, map, socials</small></button>
    <button onclick="goTab('hero')"><strong>▣</strong><span>Hero Manager</span><small>Slides, text & buttons</small></button>
    <button onclick="goTab('gallery')"><strong>▧</strong><span>Media Gallery</span><small>Images & videos</small></button>
    <button onclick="goTab('testimonials')"><strong>★</strong><span>Testimonials</span><small>Customer reviews</small></button>
  </div>
  <div class="panel livePanel"><div><h3>Live publishing</h3><p>Changes are saved to Google Sheets/Drive and the public website checks for updates automatically.</p></div><span class="version">Version ${esc(DB.version)}</span></div>`;
}
function goTab(k){document.querySelector(`.tab[data-tab="${k}"]`)?.click()}
function renderTab(tab){
  const c=$('#content');
  if(tab==='dashboard')return renderDashboard();
  if(tab==='settings')c.innerHTML=settings();
  else if(tab==='hero')c.innerHTML=crud('HERO','Hero Slider','hero');
  else if(tab==='services')c.innerHTML=crud('SERVICES','Services','services');
  else if(tab==='products')c.innerHTML=crud('PRODUCTS','Products','products');
  else if(tab==='plans')c.innerHTML=crud('PLANS','Plans','plans');
  else if(tab==='gallery')c.innerHTML=crud('GALLERY','Gallery / Video','gallery');
  else if(tab==='testimonials')c.innerHTML=crud('TESTIMONIALS','Testimonials','testimonials');
}
function settings(){
  const groups=[
    {title:'Brand identity',keys:['siteName','siteTagline','logoText','logoSub','primaryColor','heroInterval']},
    {title:'Contact & location',keys:['phone','email','address','whatsapp','mapEmbed','contactTitle','contactSubtitle']},
    {title:'Social media',keys:['facebook','instagram','youtube','linkedin']},
    {title:'About & section headings',keys:['aboutEyebrow','aboutTitle','aboutText','servicesTitle','productsTitle','plansTitle','galleryTitle','gallerySubtitle','footerText']}
  ];
  return `<div class="pageHead"><div><div class="eyebrow">MASTER SETTINGS</div><h1>Brand & Website Settings</h1><p>Everything here is reflected on the live website.</p></div><button class="btn gold" onclick="saveSettings()">Save All Changes</button></div>
  <div class="panel logoPanel"><div><div class="logoPreview" id="logoPreview">${setting('siteLogo')?`<img src="${esc(setting('siteLogo'))}">`:'<span>A</span>'}</div></div><div class="logoInfo"><h3>Website Logo</h3><p>Upload your real logo. It will replace the temporary A mark in the top header and footer.</p><input id="logoFile" type="file" accept="image/*" onchange="previewLogo(event)"><div class="uploadQueue" id="settingsQueue"></div></div></div>
  ${groups.map(g=>`<div class="panel"><div class="panelTitle"><h3>${g.title}</h3></div><div class="formGrid">${g.keys.map(k=>fieldSetting(k)).join('')}</div></div>`).join('')}
  <div class="panel passwordPanel"><h3>Admin security</h3><div class="row"><input id="newPass" type="password" placeholder="New password — minimum 6 characters" style="flex:1"><button class="btn" onclick="changePassword()">Change Password</button></div></div>`;
}
function fieldSetting(k){
  const labels={siteName:'Website Name',siteTagline:'Website Tagline',logoText:'Logo Text (fallback)',logoSub:'Logo Subtitle',primaryColor:'Primary Color',heroInterval:'Hero Slide Interval (ms)',phone:'Phone',email:'Email',address:'Address',whatsapp:'WhatsApp Number',mapEmbed:'Google Maps Embed URL / iframe src',contactTitle:'Contact Title',contactSubtitle:'Contact Subtitle',facebook:'Facebook URL',instagram:'Instagram URL',youtube:'YouTube URL',linkedin:'LinkedIn URL',aboutEyebrow:'About Eyebrow',aboutTitle:'About Title',aboutText:'About Text',servicesTitle:'Services Heading',productsTitle:'Products Heading',plansTitle:'Plans Heading',galleryTitle:'Gallery Heading',gallerySubtitle:'Gallery Subtitle',footerText:'Footer Text'};
  const v=setting(k), area=['address','mapEmbed','aboutText','footerText','contactSubtitle'].includes(k);
  return `<div class="field ${area?'full':''}"><label>${labels[k]||k}</label>${area?`<textarea id="set_${k}">${esc(v)}</textarea>`:`<input id="set_${k}" value="${esc(v)}" ${k==='heroInterval'?'type="number"':''}>`}${k==='mapEmbed'?'<small class="fieldHelp">Paste only the Google Maps Embed URL or the iframe src value.</small>':''}</div>`;
}
function setting(k){const x=(DB.settings||[]).find(r=>String(r.key)===String(k));return x?x.value:''}
function previewLogo(e){const f=e.target.files?.[0];if(!f)return;const u=URL.createObjectURL(f);$('#logoPreview').innerHTML=`<img src="${u}">`}
async function saveSettings(){
  try{
    const keys=[...document.querySelectorAll('[id^="set_"]')].map(x=>x.id.slice(4));
    const items=keys.map(k=>({key:k,value:$('#set_'+k).value}));
    const lf=$('#logoFile')?.files?.[0];
    if(lf){
      setSettingsUpload(lf.name,'Preparing logo…','work');
      const name='LOGO_'+Date.now()+'_'+safeFileName(lf.name);
      const url=await uploadAndGetUrl(lf,name,m=>setSettingsUpload(lf.name,m,'work'));
      items.push({key:'siteLogo',value:url});
    }
    await post({action:'saveSettings',items});
    await refresh('All website settings saved ✓');
    renderTab('settings');
  }catch(e){showToast('Save failed: '+e.message,'error')}
}
function setSettingsUpload(n,m,state='work'){const b=$('#settingsQueue');if(!b)return;b.innerHTML=`<div class="uploadRow ${state}"><span>${esc(n)}</span><span>${esc(m)}</span></div>`}
async function changePassword(){
  try{const p=$('#newPass').value;if(!p||p.length<6)return showToast('Minimum 6 characters','error');await post({action:'changePassword',newPassword:p});$('#newPass').value='';showToast('Password changed ✓')}catch(e){showToast(e.message,'error')}
}
const schemas={
  hero:{sheet:'HERO',fields:[['imageUrl','Image URL / uploaded file','text'],['titleSmall','Small Heading','text'],['title1','Main Heading 1','text'],['title2','Main Heading 2','text'],['description','Description','textarea'],['button1','Button 1','text'],['button1Link','Button 1 Link','text'],['button2','Button 2','text'],['button2Link','Button 2 Link','text'],['sort','Order','number'],['active','Active','selectYESNO']]},
  services:{sheet:'SERVICES',fields:[['icon','Icon / Emoji','text'],['name','Service Name','text'],['description','Description','text'],['sort','Order','number'],['active','Active','selectYESNO']]},
  products:{sheet:'PRODUCTS',fields:[['name','Product Name','text'],['price','Price','text'],['imageUrl','Image URL / uploaded file','text'],['shortDescription','Short Description','text'],['description','Full Description','textarea'],['features','Features (use | between items)','textarea'],['category','Category','text'],['sort','Order','number'],['active','Active','selectYESNO']]},
  plans:{sheet:'PLANS',fields:[['name','Plan Name','text'],['tagline','Tagline','text'],['price','Price','text'],['period','Period','text'],['color','Color','text'],['features','Features (use | between items)','textarea'],['sort','Order','number'],['active','Active','selectYESNO'],['buttonText','Button Text','text'],['buttonLink','Button Link','text']]},
  gallery:{sheet:'GALLERY',fields:[['section','Section','text'],['type','Type','selectMedia'],['title','Title','text'],['mediaUrl','Media URL / uploaded file','text'],['thumbUrl','Thumbnail URL','text'],['sort','Order','number'],['active','Active','selectYESNO']]},
  testimonials:{sheet:'TESTIMONIALS',fields:[['quote','Review / Quote','textarea'],['name','Customer Name','text'],['role','Customer Role','text'],['sort','Order','number'],['active','Active','selectYESNO']]}
};
function crud(type,title,key){
  const rows=[...(DB[key]||[])].sort((a,b)=>(+a.sort||0)-(+b.sort||0));
  return `<div class="pageHead"><div><div class="eyebrow">CONTENT MANAGER</div><h1>${title}</h1><p>Manage, publish, hide and reorder ${title.toLowerCase()}.</p></div><div class="headActions"><button class="btn gold" onclick="editItem('${key}','')">+ Add New</button>${key==='hero'||key==='gallery'?`<button class="btn" onclick="bulkUpload('${key}')">⇧ Bulk Upload</button>`:''}</div></div>
  <div class="panel"><div class="list">${rows.length?rows.map(x=>itemRow(key,x)).join(''):'<div class="empty">No items yet.</div>'}</div></div>`;
}
function itemRow(key,x){
  let image=x.imageUrl||x.mediaUrl||'';
  const title=x.name||x.title||x.section||x.quote||'Untitled';
  const desc=x.price||x.description||x.shortDescription||x.role||'';
  const thumb=image&&String(x.type)!=='video'?`<img class="thumb" src="${esc(image)}" loading="lazy">`:String(x.type)==='video'?'<div class="thumb videoThumb">▶ VIDEO</div>':`<div class="thumb">${key==='testimonials'?'★':'+'}</div>`;
  const live=String(x.active).toUpperCase()==='YES'?'<span class="pill on">LIVE</span>':'<span class="pill off">HIDDEN</span>';
  return `<div class="item"><div>${thumb}</div><div><div class="itemMeta">${live}</div><h4>${esc(title)}</h4><p>${esc(desc)}</p></div><div class="itemActions"><button class="iconBtn" onclick='editItem("${key}","${esc(x.id)}")'>Edit</button><button class="iconBtn danger" onclick='removeItem("${key}","${esc(x.id)}")'>Delete</button></div></div>`;
}
function editItem(key,id){
  const s=schemas[key], row=(DB[key]||[]).find(x=>String(x.id)===String(id))||{id:key.toUpperCase().slice(0,2)+(Date.now()%100000)};
  $('#modal').innerHTML=`<div class="modalBox"><div class="modalHead"><div><div class="eyebrow">EDITOR</div><h2>${id?'Edit':'Add'} ${key}</h2></div><button class="close" onclick="closeModal()">×</button></div><input type="hidden" id="f_id" value="${esc(row.id)}"><div class="formGrid" id="editForm" style="margin-top:15px">${s.fields.map(([f,l,t])=>field(f,l,t,row[f]??'')).join('')}</div>${['hero','products','gallery'].includes(key)?uploadUI(key):''}<div class="saveBar"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn green" onclick="saveItem('${key}')">Save & Publish</button></div></div>`;
  $('#modal').classList.add('show');
}
function field(f,l,t,v){
  if(t==='textarea')return `<div class="field full"><label>${l}</label><textarea id="f_${f}">${esc(v)}</textarea></div>`;
  if(t==='selectYESNO')return `<div class="field"><label>${l}</label><select id="f_${f}"><option ${String(v).toUpperCase()==='YES'?'selected':''}>YES</option><option ${String(v).toUpperCase()!=='YES'?'selected':''}>NO</option></select></div>`;
  if(t==='selectMedia')return `<div class="field"><label>${l}</label><select id="f_${f}"><option ${v==='image'?'selected':''}>image</option><option ${v==='video'?'selected':''}>video</option></select></div>`;
  return `<div class="field"><label>${l}</label><input id="f_${f}" type="${t==='number'?'number':'text'}" value="${esc(v)}"></div>`;
}
function uploadUI(key){
  return `<div class="uploadBox" style="margin-top:15px"><b>Upload ${key==='gallery'?'image / video files':'image'}</b><br><small>Large images are compressed automatically. Gallery supports multiple files.</small><input id="fileInput" type="file" ${key==='gallery'?'multiple':''} accept="${key==='gallery'?'image/*,video/*':'image/*'}" onchange="previewFiles(event,'${key}')"><div class="previewGrid" id="previewGrid"></div><div class="uploadQueue" id="uploadQueue"></div></div>`;
}
function previewFiles(e,key){const box=$('#previewGrid');box.innerHTML='';[...e.target.files].forEach(f=>{const u=URL.createObjectURL(f);box.insertAdjacentHTML('beforeend',f.type.startsWith('video/')?`<video src="${u}" controls></video>`:`<img src="${u}">`)})}
async function saveItem(key){
  try{
    const s=schemas[key],obj={id:$('#f_id').value};
    s.fields.forEach(([f])=>obj[f]=$('#f_'+f)?.value||'');
    const files=$('#fileInput')?.files;
    if(files&&files.length){
      if(key==='gallery'&&files.length>1)return doBulkUpload(key,files);
      const f=files[0],name='UP_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)+'_'+safeFileName(f.name);
      setUploadStatus(f.name,'Preparing…','work');
      const url=await uploadAndGetUrl(f,name,m=>setUploadStatus(f.name,m,'work'));
      if(key==='gallery'){obj.mediaUrl=url;obj.thumbUrl=url;obj.type=f.type.startsWith('video/')?'video':'image'}
      else obj.imageUrl=url;
    }
    await post({action:'saveRows',sheet:s.sheet,rows:[obj]});
    await refresh('Saved & published ✓');closeModal();renderTab(key);
  }catch(e){showToast('Save failed: '+e.message,'error')}
}
async function removeItem(key,id){
  if(!confirm('Delete this item from the website?'))return;
  try{await post({action:'deleteRow',sheet:schemas[key].sheet,id});await refresh('Item deleted ✓');renderTab(key)}catch(e){showToast('Delete failed: '+e.message,'error')}
}
function safeFileName(n){return String(n||'file').replace(/[^a-zA-Z0-9._-]/g,'_')}
function setUploadStatus(name,msg,state='work'){
  const box=$('#uploadQueue');if(!box)return;
  const id='uq_'+btoa(unescape(encodeURIComponent(name))).replace(/[^a-zA-Z0-9]/g,'');
  let el=document.getElementById(id);
  if(!el){el=document.createElement('div');el.className='uploadRow';el.id=id;box.appendChild(el)}
  el.className='uploadRow '+state;el.innerHTML=`<span class="uploadName">${esc(name)}</span><span class="uploadState">${esc(msg)}</span>`;
}
async function uploadAndGetUrl(file,name,onStatus){
  const data=await prepareFile(file,onStatus);
  onStatus?.('Uploading to Drive…');
  await post({action:'uploadMedia',fileName:name,mimeType:(data.match(/^data:([^;]+);/)||[])[1]||file.type,data});
  onStatus?.('Verifying upload…');
  for(let i=0;i<18;i++){
    await new Promise(r=>setTimeout(r,i===0?500:500));
    try{const d=await jsonp(api()+'?action=mediaByName&name='+encodeURIComponent(name));if(d.ok){onStatus?.('Uploaded ✓','done');return d.url}}catch(e){}
  }
  onStatus?.('Upload verification failed','error');throw Error('Drive upload could not be verified');
}
async function bulkUpload(key,selectedFiles){
  const accept=key==='hero'?'image/*':'image/*,video/*';
  if(selectedFiles)return doBulkUpload(key,selectedFiles);
  $('#modal').innerHTML=`<div class="modalBox"><div class="modalHead"><div><div class="eyebrow">MEDIA MANAGER</div><h2>Bulk Upload ${key}</h2></div><button class="close" onclick="closeModal()">×</button></div><p class="uploadHint">Select multiple files. Each file is compressed before it is sent to Drive.</p><div class="uploadBox"><input id="bulkFiles" type="file" multiple accept="${accept}"><div class="uploadQueue" id="uploadQueue"></div><div class="previewGrid" id="previewGrid"></div></div><div class="saveBar"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn green" onclick="doBulkUpload('${key}')">Upload & Publish</button></div></div>`;
  $('#modal').classList.add('show');$('#bulkFiles').onchange=e=>previewFiles(e,key);
}
async function doBulkUpload(key,passedFiles){
  const input=$('#bulkFiles'),files=passedFiles?[...passedFiles]:(input?[...input.files]:[]);
  if(!files.length)return showToast('Select files first','error');
  const sheet=schemas[key].sheet;let order=(DB[key]||[]).length+1,cursor=0;const results=new Array(files.length);
  async function worker(){
    while(true){
      const i=cursor++;if(i>=files.length)return;const f=files[i];
      try{
        setUploadStatus(f.name,'Preparing…','work');
        const name='BULK_'+Date.now()+'_'+i+'_'+Math.random().toString(36).slice(2,7)+'_'+safeFileName(f.name);
        results[i]={f,url:await uploadAndGetUrl(f,name,m=>setUploadStatus(f.name,m,'work'))};
      }catch(e){results[i]={f,error:e.message};setUploadStatus(f.name,'Failed: '+e.message,'error')}
    }
  }
  await Promise.all(Array.from({length:Math.min(3,files.length)},worker));
  const rows=[];
  results.forEach(r=>{
    if(!r||r.error)return;
    const f=r.f,base=f.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ');
    const obj={id:key.toUpperCase().slice(0,2)+(Date.now()%100000)+Math.floor(Math.random()*9999),sort:order++,active:'YES'};
    if(key==='hero')Object.assign(obj,{imageUrl:r.url,titleSmall:'LET’S GROW YOUR BRAND TOGETHER',title1:base,title2:'Powerful Results',description:'Creative advertising solutions for your business.',button1:'Explore Services',button1Link:'#services',button2:'Get a Free Quote',button2Link:'#contact'});
    else Object.assign(obj,{section:f.type.startsWith('video/')?'Video Production':'New Gallery',type:f.type.startsWith('video/')?'video':'image',title:base,mediaUrl:r.url,thumbUrl:r.url});
    rows.push(obj);
  });
  if(rows.length)await post({action:'saveRows',sheet,rows});
  await refresh(`${rows.length} file${rows.length!==1?'s':''} uploaded & published`);
  renderTab(key);if(rows.length===files.length)setTimeout(closeModal,450);
}
async function prepareFile(file,onStatus){
  if(file.type.startsWith('image/')){
    if(file.size<=160*1024){onStatus?.('Small image — direct upload ✓');return toData(file)}
    onStatus?.('Compressing image…');return compressImage(file);
  }
  if(file.type.startsWith('video/')){
    if(file.size<=600*1024){onStatus?.('Small video — direct upload ✓');return toData(file)}
    onStatus?.('Compressing video…');return compressVideo(file);
  }
  return toData(file);
}
function toData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function compressImage(file){
  return new Promise((resolve,reject)=>{
    const img=new Image(),r=new FileReader();
    r.onload=()=>{img.onload=()=>{
      let max=Math.min(1800,Math.max(img.width,img.height)),scale=Math.min(1,max/Math.max(img.width,img.height)),q=.8,data='';
      for(let pass=0;pass<6;pass++){
        const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));
        c.getContext('2d',{alpha:false}).drawImage(img,0,0,c.width,c.height);data=c.toDataURL('image/jpeg',q);
        if((data.length*0.75)<=280*1024)break;q=Math.max(.38,q-.08);scale*=.86;
      } resolve(data);
    };img.onerror=reject;img.src=r.result};r.onerror=reject;r.readAsDataURL(file);
  })
}
function compressVideo(file){
  return new Promise(async resolve=>{
    if(!('MediaRecorder' in window)){resolve(await toData(file));return}
    const v=document.createElement('video');v.src=URL.createObjectURL(file);v.muted=true;v.playsInline=true;
    try{await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=rej});const duration=Math.max(1,v.duration||1),c=document.createElement('canvas'),scale=Math.min(1,720/Math.max(v.videoWidth,v.videoHeight));c.width=Math.max(1,Math.round(v.videoWidth*scale));c.height=Math.max(1,Math.round(v.videoHeight*scale));const ctx=c.getContext('2d'),stream=c.captureStream(15),mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp8')?'video/webm;codecs=vp8':'video/webm',targetBits=Math.max(70000,Math.min(240000,(650*1024*8/duration)));const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:targetBits}),chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);rec.onstop=()=>{const blob=new Blob(chunks,{type:mime}),r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(blob)};rec.start(500);const draw=()=>{if(v.ended){rec.stop();return}ctx.drawImage(v,0,0,c.width,c.height);requestAnimationFrame(draw)};await v.play();draw()}catch(e){resolve(await toData(file))}
  })
}
function closeModal(){$('#modal').classList.remove('show');$('#modal').innerHTML=''}
if(token)start();
