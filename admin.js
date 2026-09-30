let token='';
let DB={};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const api=()=>String(window.VIGYAPAN_CONFIG?.API||'').trim();

function showToast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>e.style.display='none',2800)}
function jsonp(url){return new Promise((resolve,reject)=>{const cb='a_'+Date.now()+Math.random().toString(16).slice(2);const s=document.createElement('script');const to=setTimeout(()=>{s.remove();delete window[cb];reject(Error('timeout'))},12000);window[cb]=d=>{clearTimeout(to);s.remove();delete window[cb];resolve(d)};s.onerror=()=>{clearTimeout(to);s.remove();delete window[cb];reject(Error('api error'))};s.src=url+(url.includes('?')?'&':'?')+'callback='+cb;document.body.appendChild(s)})}

// Apps Script web apps do not expose normal CORS response headers. A simple text POST
// lets the browser send the request; the result is verified with a GET/JSONP call.
async function post(body){
  if(!token)throw Error('Please login again');
  const payload=JSON.stringify(Object.assign({},body,{token}));
  await fetch(api(),{method:'POST',mode:'no-cors',body:payload,keepalive:false});
  await new Promise(r=>setTimeout(r,300));
  return {ok:true};
}
async function waitForVersion(oldVersion,tries=16){
  for(let i=0;i<tries;i++){
    try{const d=await jsonp(api()+'?action=version');if(d&&d.version&&String(d.version)!==String(oldVersion))return d.version}catch(e){}
    await new Promise(r=>setTimeout(r,350));
  }
  return null;
}

async function loadBrand(){
  try{const d=await jsonp(api()+'?action=brand');if(d?.logoUrl){
    ['loginBrand','sideBrandImg'].forEach(id=>{const e=document.getElementById(id);if(e){e.src=d.logoUrl;e.classList.add('show')}});
    const t=document.getElementById('loginBrandText');if(t)t.textContent=d.siteName||'VIGYAPAN';
  }}catch(e){}
}
async function login(){
  const p=$('#password').value.trim();if(!p)return showToast('Enter admin password');
  try{const d=await jsonp(api()+'?action=login&password='+encodeURIComponent(p));if(!d.ok)return showToast(d.error||'Invalid password');token=d.token;await start()}catch(e){showToast('Check Apps Script URL in config.js')}
}
function logout(){token='';location.reload()}
async function start(){
  if(!token)return;
  try{
    const d=await jsonp(api()+'?action=authCheck&token='+encodeURIComponent(token));
    if(!d.ok){token='';return}
    $('#login').classList.add('hidden');$('#app').classList.remove('hidden');
    await load();applyAdminBrand();bindTabs();renderDashboard();
  }catch(e){token='';$('#login').classList.remove('hidden');$('#app').classList.add('hidden');showToast('Session expired. Please login again.')}
}
async function load(){const d=await jsonp(api()+'?action=public');if(!d||!d.version)throw Error('CMS data unavailable');DB=d}
function applyAdminBrand(){const url=setting('logoUrl');if(url){['sideBrandImg','loginBrand'].forEach(id=>{const e=document.getElementById(id);if(e){e.src=url;e.classList.add('show')}})}}
function bindTabs(){document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderTab(b.dataset.tab);if(innerWidth<800)toggleSide()})}
function toggleSide(){document.querySelector('aside').classList.toggle('open')}
function renderDashboard(){renderTab('dashboard')}
function renderTab(tab){const c=$('#content');if(tab==='dashboard')c.innerHTML=dashboard();else if(tab==='settings')c.innerHTML=settings();else if(tab==='hero')c.innerHTML=crud('HERO','Hero Slider','hero');else if(tab==='services')c.innerHTML=crud('SERVICES','Services','services');else if(tab==='products')c.innerHTML=crud('PRODUCTS','Products','products');else if(tab==='plans')c.innerHTML=crud('PLANS','Plans','plans');else if(tab==='gallery')c.innerHTML=crud('GALLERY','Gallery / Video','gallery')}
function dashboard(){return `<div class="pageHead"><div><h1>Dashboard</h1><p>Google Sheet + Drive CMS. Changes publish automatically.</p></div><a class="btn gold" href="index.html" target="_blank">Open Public Website ↗</a></div><div class="stats"><div class="stat"><b>${DB.hero?.length||0}</b><span>Hero Slides</span></div><div class="stat"><b>${DB.services?.length||0}</b><span>Services</span></div><div class="stat"><b>${DB.products?.length||0}</b><span>Products</span></div><div class="stat"><b>${DB.gallery?.length||0}</b><span>Gallery / Videos</span></div></div><div class="panel" style="margin-top:15px"><h3>Live publishing</h3><p class="uploadHint">Uploaded media is saved to Drive, published to the Sheet and picked up by the public website automatically. No website refresh is required.</p></div>`}
function settings(){const keys=['siteName','siteTagline','primaryColor','phone','email','address','whatsapp','facebook','instagram','youtube','linkedin','heroInterval','aboutEyebrow','aboutTitle','aboutText','galleryTitle','gallerySubtitle','productsTitle','servicesTitle','plansTitle','contactTitle','contactSubtitle','footerText'];return `<div class="pageHead"><div><h1>Site Settings</h1><p>Change website content and logo.</p></div></div>
<div class="panel logoPanel"><div class="panelTitle"><div><h3>VIGYAPAN Logo</h3><p class="uploadHint">Select your logo, upload it to Drive and save it as the live website logo.</p></div><div class="adminLogoPreview">${setting('logoUrl')?`<img id="currentLogoPreview" src="${esc(setting('logoUrl'))}">`:'<span id="currentLogoEmpty">No logo uploaded</span>'}</div></div><div class="logoUploadRow"><div><input id="logoInput" type="file" accept="image/*" onchange="previewLogo(event)"><div id="logoFileName" class="selectedFile">No file selected</div></div><button class="btn green" onclick="uploadLogo()">Upload & Save Logo</button></div><div id="logoUploadQueue" class="uploadQueue"></div></div>
<div class="panel"><div class="formGrid">${keys.map(k=>`<div class="field"><label>${k}</label><input id="set_${k}" value="${esc(setting(k))}"></div>`).join('')}</div><div class="saveBar"><button class="btn green" onclick="saveSettings()">Save Changes</button></div></div>
<div class="panel"><h3>Admin Password</h3><div class="row"><input id="newPass" type="password" placeholder="Minimum 6 characters" style="flex:1;padding:9px;border:1px solid #dbe4ea;border-radius:7px"><button class="btn" onclick="changePassword()">Change Password</button></div></div>`}
function setting(k){const x=(DB.settings||[]).find(r=>String(r.key)===String(k));return x?x.value:''}
function previewLogo(e){const f=e.target.files?.[0];const n=$('#logoFileName');if(n)n.textContent=f?f.name:'No file selected';if(f){const u=URL.createObjectURL(f);const box=$('.adminLogoPreview');if(box)box.innerHTML=`<img id="currentLogoPreview" src="${u}">`;}}
async function uploadLogo(){
  const input=$('#logoInput'),f=input?.files?.[0];if(!f)return showToast('First select a logo file');
  if(!f.type.startsWith('image/'))return showToast('Please select an image logo');
  const oldId=String(setting('logoFileId')||'')||extractDriveId(setting('logoUrl'));
  setUploadStatus(f.name,'Preparing…','work','logoUploadQueue');
  try{
    const name='VIGYAPAN_LOGO_'+Date.now()+'_'+safeFileName(f.name);
    const d=await uploadAndGetUrl(f,name,m=>setUploadStatus(f.name,m,m==='Uploaded ✓'?'done':'work','logoUploadQueue'),oldId);
    const old=DB.version;
    await post({action:'saveSettings',items:[{key:'logoUrl',value:d.url},{key:'logoFileId',value:d.fileId}]});
    await waitForVersion(old);
    await refresh('Logo uploaded & published ✓');
    input.value='';$('#logoFileName').textContent='Saved: '+f.name;applyAdminBrand();
    setTimeout(()=>{const q=$('#logoUploadQueue');if(q)q.innerHTML=''},900);
  }catch(e){setUploadStatus(f.name,e.message||'Upload failed','error','logoUploadQueue');showToast(e.message||'Logo upload failed')}
}
async function saveSettings(){try{const keys=[...document.querySelectorAll('[id^="set_"]')].map(x=>x.id.slice(4));const items=keys.map(k=>({key:k,value:$('#set_'+k).value}));const old=DB.version;await post({action:'saveSettings',items});await waitForVersion(old);await refresh('Settings saved');}catch(e){showToast(e.message||'Save failed')}}
async function changePassword(){try{await post({action:'changePassword',newPassword:$('#newPass').value});$('#newPass').value='';showToast('Password changed');}catch(e){showToast(e.message||'Password change failed')}}

const schemas={
hero:{sheet:'HERO',fields:[['imageUrl','Image URL / uploaded file','text'],['titleSmall','Small Heading','text'],['title1','Main Heading 1','text'],['title2','Main Heading 2','text'],['description','Description','textarea'],['button1','Button 1','text'],['button1Link','Button 1 Link','text'],['button2','Button 2','text'],['button2Link','Button 2 Link','text'],['sort','Order','number'],['active','Active','selectYESNO']]},
services:{sheet:'SERVICES',fields:[['icon','Icon / Emoji','text'],['name','Service Name','text'],['description','Description','text'],['sort','Order','number'],['active','Active','selectYESNO']]},
products:{sheet:'PRODUCTS',fields:[['name','Product Name','text'],['price','Price','text'],['imageUrl','Image URL / uploaded file','text'],['shortDescription','Short Description','text'],['description','Full Description','textarea'],['features','Features (use | between items)','textarea'],['category','Category','text'],['sort','Order','number'],['active','Active','selectYESNO']]},
plans:{sheet:'PLANS',fields:[['name','Plan Name','text'],['tagline','Tagline','text'],['price','Price','text'],['period','Period','text'],['color','Color','text'],['features','Features (use | between items)','textarea'],['sort','Order','number'],['active','Active','selectYESNO'],['buttonText','Button Text','text'],['buttonLink','Button Link','text']]},
gallery:{sheet:'GALLERY',fields:[['section','Section','text'],['type','Type','selectMedia'],['title','Title','text'],['mediaUrl','Media URL / uploaded file','text'],['thumbUrl','Thumbnail URL','text'],['sort','Order','number'],['active','Active','selectYESNO']]}
};
function crud(type,title,key){const rows=(DB[key]||[]).slice().sort((a,b)=>(+a.sort||0)-(+b.sort||0));return `<div class="pageHead"><div><h1>${title}</h1><p>Add, edit, delete and reorder content.</p></div><div class="headActions"><button class="btn gold" onclick="editItem('${key}','')">+ Add New</button>${key==='hero'||key==='gallery'?`<button class="btn" onclick="bulkUpload('${key}')">⇧ Bulk Upload</button>`:''}</div></div><div class="panel"><div class="list">${rows.length?rows.map(x=>itemRow(key,x)).join(''):'<div class="empty">No items yet. Click Add New.</div>'}</div></div>`}
function itemRow(key,x){let image=x.imageUrl||x.mediaUrl||'';return `<div class="item"><div>${image&&String(x.type)!=='video'?`<img class="thumb" src="${esc(image)}" onerror="this.style.display='none'">`:String(x.type)==='video'?'<div class="thumb" style="display:grid;place-items:center">▶ VIDEO</div>':'<div class="thumb"></div>'}</div><div><h4>${esc(x.name||x.title||x.section||'Untitled')}</h4><p>${esc(x.price||x.description||x.shortDescription||x.section||'')}</p></div><div class="itemActions"><button class="iconBtn" onclick='editItem("${key}","${esc(x.id)}")'>Edit</button><button class="iconBtn danger" onclick='removeItem("${key}","${esc(x.id)}")'>Delete</button></div></div>`}
function editItem(key,id){const s=schemas[key], row=(DB[key]||[]).find(x=>String(x.id)===String(id))||{id:key.toUpperCase().slice(0,2)+(Date.now()%100000),sort:(DB[key]?.length||0)+1,active:'YES'};$('#modal').innerHTML=`<div class="modalBox"><div class="modalHead"><h2>${id?'Edit':'Add'} ${key}</h2><button class="close" onclick="closeModal()">×</button></div><input type="hidden" id="f_id" value="${esc(row.id)}"><div class="formGrid" id="editForm" style="margin-top:15px">${s.fields.map(([f,l,t])=>field(f,l,t,row[f]??'')).join('')}</div>${['hero','products','gallery'].includes(key)?uploadUI(key,row):''}<div class="saveBar"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn green" onclick="saveItem('${key}')">Save & Update Website</button></div></div>`;$('#modal').classList.add('show')}
function field(f,l,t,v){if(t==='textarea')return `<div class="field full"><label>${l}</label><textarea id="f_${f}">${esc(v)}</textarea></div>`;if(t==='selectYESNO')return `<div class="field"><label>${l}</label><select id="f_${f}"><option ${String(v).toUpperCase()==='YES'?'selected':''}>YES</option><option ${String(v).toUpperCase()!=='YES'?'selected':''}>NO</option></select></div>`;if(t==='selectMedia')return `<div class="field"><label>${l}</label><select id="f_${f}"><option ${v==='image'?'selected':''}>image</option><option ${v==='video'?'selected':''}>video</option></select></div>`;return `<div class="field"><label>${l}</label><input id="f_${f}" type="${t==='number'?'number':'text'}" value="${esc(v)}"></div>`}
function uploadUI(key,row){return `<div class="uploadBox" style="margin-top:15px"><b>${key==='gallery'?'Gallery Upload':'Image Upload'}</b><p class="uploadHint">1. Select file → filename appears. 2. Click Upload. 3. Wait for Uploaded ✓. 4. Save to publish.</p><input id="fileInput" type="file" accept="${key==='gallery'?'image/*,video/*':'image/*'}" onchange="previewFiles(event,'${key}')"><div id="selectedUploadName" class="selectedFile">No file selected</div><div class="previewGrid" id="previewGrid"></div><div class="uploadQueue" id="uploadQueue"></div><div class="uploadActionRow"><button class="btn" type="button" onclick="uploadSingle('${key}')">⇧ Upload</button><span id="singleUploadNote" class="uploadNote">Not uploaded</span></div></div>`}
function previewFiles(e,key){const files=[...e.target.files];const box=$('#previewGrid');const name=$('#selectedUploadName');if(name)name.textContent=files.length?files.map(f=>f.name).join(', '):'No file selected';if(!box)return;box.innerHTML='';files.slice(0,key==='gallery'?5:1).forEach(f=>{const u=URL.createObjectURL(f);box.insertAdjacentHTML('beforeend',f.type.startsWith('video/')?`<video src="${u}" controls></video>`:`<img src="${u}">`)})}
function safeFileName(n){return String(n||'file').replace(/[^a-zA-Z0-9._-]/g,'_')}
function setUploadStatus(name,msg,state='work',boxId='uploadQueue'){const box=document.getElementById(boxId);if(!box)return;const id='uq_'+Math.abs(hashCode(name));let el=document.getElementById(id);if(!el){el=document.createElement('div');el.className='uploadRow';el.id=id;box.appendChild(el)}el.className='uploadRow '+state;el.innerHTML=`<span class="uploadName">${esc(name)}</span><span class="uploadState">${esc(msg)}</span>`}
function hashCode(s){let h=0;for(let i=0;i<String(s).length;i++)h=((h<<5)-h)+String(s).charCodeAt(i)|0;return h}
function extractDriveId(u){const s=String(u||'');let m=s.match(/[?&]id=([\w-]+)/);if(m)return m[1];m=s.match(/\/d\/([\w-]+)/);return m?m[1]:''}
async function prepareFile(file,onStatus){if(file.type.startsWith('image/')){if(file.size<=100*1024){onStatus?.('Ready to upload ✓');return toData(file)}onStatus?.('Compressing image…');return compressImage(file)}if(file.type.startsWith('video/')){if(file.size<=500*1024){onStatus?.('Ready to upload ✓');return toData(file)}onStatus?.('Compressing video…');return compressVideo(file)}return toData(file)}
function toData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function compressImage(file){return new Promise((resolve,reject)=>{const img=new Image();const r=new FileReader();r.onload=()=>{img.onload=()=>{let max=1600,scale=Math.min(1,max/Math.max(img.width,img.height)),q=.82,data='';for(let pass=0;pass<8;pass++){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));const x=c.getContext('2d',{alpha:false});x.drawImage(img,0,0,c.width,c.height);data=c.toDataURL('image/jpeg',q);if(data.length<=136000)break;q=Math.max(.35,q-.07);scale*=.82}resolve(data)};img.onerror=()=>reject(Error('Could not read image'));img.src=r.result};r.onerror=()=>reject(Error('Could not read file'));r.readAsDataURL(file)})}
function compressVideo(file){return new Promise(async resolve=>{if(!('MediaRecorder' in window)){resolve(await toData(file));return}try{const v=document.createElement('video');v.src=URL.createObjectURL(file);v.muted=true;v.playsInline=true;await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=rej});const duration=Math.max(1,v.duration||1),c=document.createElement('canvas'),scale=Math.min(1,640/Math.max(v.videoWidth,v.videoHeight));c.width=Math.max(1,Math.round(v.videoWidth*scale));c.height=Math.max(1,Math.round(v.videoHeight*scale));const ctx=c.getContext('2d'),stream=c.captureStream(15),mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp8')?'video/webm;codecs=vp8':'video/webm',targetBits=Math.max(70000,Math.min(180000,(450*1024*8/duration))),rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:targetBits}),chunks=[];rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);rec.onstop=()=>{const blob=new Blob(chunks,{type:mime}),r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(blob)};rec.start(500);const draw=()=>{if(v.ended){rec.stop();return}ctx.drawImage(v,0,0,c.width,c.height);requestAnimationFrame(draw)};await v.play();draw()}catch(e){resolve(await toData(file))}})}

async function uploadAndGetUrl(file,name,onStatus,replaceFileId=''){const data=await prepareFile(file,onStatus);onStatus?.('Uploading to Drive…');await post({action:'uploadMedia',fileName:name,mimeType:(data.match(/^data:([^;]+);/)||[])[1]||file.type,data,replaceFileId});onStatus?.('Verifying upload…');for(let i=0;i<18;i++){try{const d=await jsonp(api()+'?action=mediaByName&name='+encodeURIComponent(name));if(d.ok){onStatus?.('Uploaded ✓');return d}}catch(e){}await new Promise(r=>setTimeout(r,300))}onStatus?.('Upload failed','error');throw Error('Upload verification failed')}

async function uploadSingle(key){
  const input=$('#fileInput');const f=input?.files?.[0];if(!f)return showToast('First select a file');
  const row=(DB[key]||[]).find(x=>String(x.id)===$('#f_id').value)||{};
  const replaceId=extractDriveId(key==='gallery'?row.mediaUrl:row.imageUrl);
  const name='MEDIA_'+Date.now()+'_'+safeFileName(f.name);
  const note=$('#singleUploadNote');if(note)note.textContent='Uploading…';setUploadStatus(f.name,'Preparing…','work');
  try{const d=await uploadAndGetUrl(f,name,m=>{setUploadStatus(f.name,m,m==='Uploaded ✓'?'done':'work');if(note)note.textContent=m},replaceId);if(key==='gallery'){$('#f_mediaUrl').value=d.url;$('#f_thumbUrl').value=d.url;$('#f_type').value=f.type.startsWith('video/')?'video':'image'}else $('#f_imageUrl').value=d.url;input.value='';$('#selectedUploadName').textContent='Uploaded: '+f.name;showToast('Uploaded ✓ — now saving to website');await saveItem(key,true)}catch(e){if(note)note.textContent='Upload failed';setUploadStatus(f.name,e.message||'Upload failed','error');showToast(e.message||'Upload failed')}}

async function saveItem(key,fromUpload=false){
  try{
    const s=schemas[key],obj={id:$('#f_id').value};s.fields.forEach(([f])=>obj[f]=$('#f_'+f)?.value||'');
    const old=DB.version;await post({action:'saveRows',sheet:s.sheet,rows:[obj]});
    await waitForVersion(old);
    await refresh(fromUpload?'Uploaded ✓ — website updated':'Saved — website updated');
    closeModal();renderTab(key);
  }catch(e){showToast(e.message||'Save failed')}
}

async function bulkUpload(key,selectedFiles){
  const accept=key==='hero'?'image/*':'image/*,video/*';
  if(selectedFiles)return doBulkUpload(key,selectedFiles);
  $('#modal').innerHTML=`<div class="modalBox"><div class="modalHead"><h2>Bulk Upload ${key}</h2><button class="close" onclick="closeModal()">×</button></div><p class="uploadHint">Select files. Each selected filename is shown before upload. Upload verifies the Drive file before publishing.</p><div class="uploadBox"><input id="bulkFiles" type="file" multiple accept="${accept}"><div id="bulkSelected" class="selectedFile">No file selected</div><div class="uploadQueue" id="uploadQueue"></div><div class="previewGrid" id="previewGrid"></div></div><div class="saveBar"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn green" onclick="doBulkUpload('${key}')">Upload & Publish</button></div></div>`;
  $('#modal').classList.add('show');$('#bulkFiles').onchange=e=>{const fs=[...e.target.files];$('#bulkSelected').textContent=fs.length?fs.map(f=>f.name).join(', '):'No file selected';previewFiles(e,key)};
}
async function doBulkUpload(key,passedFiles){
  const input=$('#bulkFiles'),files=passedFiles?[...passedFiles]:(input?[...input.files]:[]);if(!files.length)return showToast('Select files first');
  const sheet=schemas[key].sheet;let order=(DB[key]||[]).length+1,cursor=0;const results=new Array(files.length),concurrency=2;
  async function worker(){while(true){const i=cursor++;if(i>=files.length)return;const f=files[i];try{setUploadStatus(f.name,'Preparing…','work');const name='BULK_'+Date.now()+'_'+i+'_'+Math.random().toString(36).slice(2,7)+'_'+safeFileName(f.name);const d=await uploadAndGetUrl(f,name,m=>setUploadStatus(f.name,m,m==='Uploaded ✓'?'done':'work'));results[i]={f,url:d.url}}catch(e){results[i]={f,error:e.message};setUploadStatus(f.name,'Failed: '+e.message,'error')}}}
  await Promise.all(Array.from({length:Math.min(concurrency,files.length)},worker));
  const rows=[];results.forEach(r=>{if(!r||r.error)return;const f=r.f,base=f.name.replace(/\.[^.]+$/,'').replace(/[-_]+/g,' '),obj={id:key.toUpperCase().slice(0,2)+(Date.now()%100000)+Math.floor(Math.random()*999),sort:order++,active:'YES'};if(key==='hero')Object.assign(obj,{imageUrl:r.url,titleSmall:'LET’S GROW YOUR BRAND TOGETHER',title1:base,title2:'Powerful Results',description:'Creative advertising solutions for your business.',button1:'Explore Services',button1Link:'#services',button2:'Get a Free Quote',button2Link:'#contact'});else Object.assign(obj,{section:f.type.startsWith('video/')?'Video Production':'New Gallery',type:f.type.startsWith('video/')?'video':'image',title:base,mediaUrl:r.url,thumbUrl:r.url});rows.push(obj)});
  if(rows.length){const old=DB.version;await post({action:'saveRows',sheet,rows});await waitForVersion(old)}
  await refresh(`${rows.length} uploaded & published`);renderTab(key);setTimeout(closeModal,450);
}

async function removeItem(key,id){if(!confirm('Delete this item?'))return;try{const row=(DB[key]||[]).find(x=>String(x.id)===String(id));const old=DB.version;await post({action:'deleteRow',sheet:schemas[key].sheet,id});await waitForVersion(old);const media=key==='gallery'?row?.mediaUrl:row?.imageUrl;if(media){const fid=extractDriveId(media);if(fid){await post({action:'deleteMedia',fileId:fid})}}await refresh('Deleted');renderTab(key)}catch(e){showToast(e.message||'Delete failed')}}

async function refresh(message){await load();applyAdminBrand();if(message)showToast(message)}
function closeModal(){$('#modal').classList.remove('show');$('#modal').innerHTML=''}

// A hard refresh intentionally returns to the login screen: the token is memory-only.
window.addEventListener('pageshow',()=>{if(performance.getEntriesByType('navigation')[0]?.type==='reload'){token='';$('#login')?.classList.remove('hidden');$('#app')?.classList.add('hidden')}});
loadBrand();
