const cid=(a,b)=>[a,b].sort().join('_');
let FR={},ON={},LM={},CH=null,CR=null,seen=null,NL=[];const LS=new Set();
const NT={like:'أعجب بمنشورك',love:'أحب منشورك',comment:'علّق على منشورك',friend_request:'أرسل لك طلب صداقة',friend_accepted:'قبل طلب صداقتك',message:'أرسل لك رسالة'};
function notify(to,type,postId=null,key=null){if(to===ME.uid)return;const r=db.ref('notifications/'+to+(key?'/'+key:'')),o={type,fromUserId:ME.uid,postId,read:false,createdAt:Date.now()};(key?r.set(o):r.push(o)).catch(()=>{})}
function onReady(){
 const pr=db.ref('presence/'+ME.uid);
 db.ref('.info/connected').on('value',s=>{if(s.val()){pr.onDisconnect().remove();pr.set(true)}});
 db.ref('presence').on('value',s=>{ON=s.val()||{};drawFriends()});
 db.ref('friends/'+ME.uid).on('value',s=>{FR=s.val()||{};Object.keys(FR).forEach(watch);drawFriends();drawSug()});
 db.ref('friendRequests/'+ME.uid).on('value',drawReq);
 db.ref('notifications/'+ME.uid).orderByChild('createdAt').limitToLast(30).on('value',drawNotif);
 $('#cs').oninput=drawFriends;bindChat();bindBell();
}
function watch(f){if(LS.has(f))return;LS.add(f);db.ref('messages/'+cid(ME.uid,f)).limitToLast(1).on('value',s=>{s.forEach(c=>{LM[f]=c.val()});drawFriends()})}
async function drawFriends(){
 const us=await Promise.all(Object.keys(FR).map(gu)),q=$('#cs').value.trim().toLowerCase();
 const row=(u,x)=>`<button class="sug fr" data-c="${u.uid}">${av(u)}${ON[u.uid]?'<i class="dot"></i>':''}<div class="grow"><b>${nm(u)}</b>${x}</div></button>`;
 $('#onl').innerHTML=us.filter(u=>ON[u.uid]).map(u=>row(u,'<div class="mu">متصل الآن</div>')).join('')||'<p class="mu">لا أحد متصل الآن.</p>';
 $('#cv').innerHTML=us.filter(u=>!q||(u.name||'').toLowerCase().includes(q)).sort((a,b)=>(LM[b.uid]?.createdAt||0)-(LM[a.uid]?.createdAt||0)).map(u=>{const m=LM[u.uid];return row(u,`<div class="mu">${m?(m.type==='image'?'📷 صورة':esc(m.text).slice(0,28))+' · '+ago(m.createdAt):'ابدأ المحادثة'}</div>`)}).join('')||'<p class="mu">أضف أصدقاء لبدء المحادثة.</p>';
 document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>openChat(b.dataset.c));
}
async function drawSug(){
 const s=await db.ref('users').limitToLast(12).once('value'),us=[];
 s.forEach(c=>{const u=c.val();if(u.uid!==ME.uid&&!u.blocked&&!FR[u.uid])us.push(u)});
 const st=await Promise.all(us.map(u=>db.ref(`friendRequests/${u.uid}/${ME.uid}`).once('value').then(x=>x.exists())));
 $('#sug').innerHTML=us.map((u,i)=>`<div class="sug">${av(u)}<div class="grow"><a href="/profile?id=${u.uid}"><b>${nm(u)}</b></a></div><button class="btn sm" data-a="${u.uid}" ${st[i]?'disabled':''}>${st[i]?'تم الإرسال':'إضافة'}</button></div>`).join('')||'<p class="mu">لا اقتراحات حاليًا.</p>';
 document.querySelectorAll('[data-a]').forEach(b=>b.onclick=async()=>{b.disabled=true;
  try{await db.ref(`friendRequests/${b.dataset.a}/${ME.uid}`).set({from:ME.uid,status:'pending',createdAt:Date.now()});notify(b.dataset.a,'friend_request',null,'fr_'+ME.uid);b.textContent='تم الإرسال';toast('تم إرسال طلب الصداقة')}
  catch(e){b.disabled=false;toast(errMsg(e),'err')}});
}
async function drawReq(s){
 const ids=Object.keys(s.val()||{}),us=await Promise.all(ids.map(gu));$('#rqc').hidden=!ids.length;
 $('#rq').innerHTML=us.map(u=>`<div class="sug">${av(u)}<div class="grow"><b>${nm(u)}</b></div><button class="btn sm" data-ok="${u.uid}">قبول</button><button class="btn ghost sm" data-no="${u.uid}">رفض</button></div>`).join('');
 document.querySelectorAll('[data-ok]').forEach(b=>b.onclick=()=>accept(b.dataset.ok));
 document.querySelectorAll('[data-no]').forEach(b=>b.onclick=()=>db.ref(`friendRequests/${ME.uid}/${b.dataset.no}`).remove().then(()=>toast('تم رفض الطلب')).catch(e=>toast(errMsg(e),'err')));
}
async function accept(f){try{
 await db.ref(`friends/${ME.uid}/${f}`).set('accepted');await db.ref(`friends/${f}/${ME.uid}`).set('accepted');
 await db.ref(`friendRequests/${ME.uid}/${f}`).remove();notify(f,'friend_accepted',null,'fa_'+ME.uid);toast('أصبحتما أصدقاء 🎉')}catch(e){toast(errMsg(e),'err')}}
/* الدردشة */
function bindChat(){
 $('#cx').onclick=closeChat;
 $('#cf').onsubmit=e=>{e.preventDefault();const t=$('#ci').value.trim();if(!t)return;$('#ci').value='';send({type:'text',text:t})};
 $('#cimg').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{send({type:'image',imageBase64:await compressImage(f,800)})}catch(x){toast(x.message,'err')}};
 $('#cem').onclick=()=>$('#emo').hidden=!$('#emo').hidden;
 $('#emo').onclick=e=>{if(e.target.tagName==='BUTTON'){$('#ci').value+=e.target.textContent;$('#ci').focus()}};
 $('#cun').onclick=async()=>{if(!confirm('إزالة هذا الصديق؟'))return;
  try{await db.ref(`friends/${ME.uid}/${CH}`).remove();await db.ref(`friends/${CH}/${ME.uid}`).remove();closeChat();toast('تمت إزالة الصديق')}catch(e){toast(errMsg(e),'err')}};
}
function send(m){if(!CH)return;db.ref('messages/'+cid(ME.uid,CH)).push({senderId:ME.uid,text:'',...m,createdAt:Date.now()}).then(()=>notify(CH,'message',null,'m_'+ME.uid)).catch(e=>toast(errMsg(e),'err'))}
function closeChat(){CR?.off();CR=null;CH=null;$('#cw').classList.remove('on')}
async function openChat(f){
 const u=await gu(f);CR?.off();CH=f;
 $('#ch').innerHTML=`${av(u)}<div class="grow"><b>${nm(u)}</b><div class="mu">${ON[f]?'متصل الآن':'غير متصل'}</div></div>`;
 $('#cmsg').innerHTML='';$('#cw').classList.add('on');
 CR=db.ref('messages/'+cid(ME.uid,f)).orderByChild('createdAt').limitToLast(50);
 CR.on('child_added',s=>{const m=s.val(),d=document.createElement('div');d.className='bub '+(m.senderId===ME.uid?'me':'th');
  d.innerHTML=(m.type==='image'?`<img src="${m.imageBase64}" alt="صورة مرسلة">`:esc(m.text))+`<small>${ago(m.createdAt)}</small>`;
  const b=$('#cmsg');b.append(d);b.scrollTop=b.scrollHeight});
}
/* الإشعارات */
function bindBell(){
 $('#bell').onclick=()=>{const p=$('#np');p.hidden=!p.hidden;
  if(!p.hidden){const u={};NL.forEach(n=>{if(!n.read)u[n.id+'/read']=true});if(Object.keys(u).length)db.ref('notifications/'+ME.uid).update(u)}};
 document.addEventListener('click',e=>{if(!e.target.closest('.npw'))$('#np').hidden=true});
}
async function drawNotif(s){
 const a=[];s.forEach(c=>{a.push({id:c.key,...c.val()})});a.reverse();
 const fresh=a.filter(n=>!n.read&&seen&&!seen.has(n.id));seen=new Set(a.map(n=>n.id));NL=a;
 const us=await Promise.all(a.map(n=>gu(n.fromUserId))),un=a.filter(n=>!n.read).length;
 $('#bd').hidden=!un;$('#bd').textContent=un>9?'9+':un;
 $('#np').innerHTML=a.map((n,i)=>`<div class="sug nt ${n.read?'':'unr'}">${av(us[i])}<div class="grow"><b>${esc(us[i].name)}</b> ${NT[n.type]||''}<div class="mu">${ago(n.createdAt)}</div></div></div>`).join('')||'<p class="empty">لا توجد إشعارات.</p>';
 fresh.forEach(n=>toast(`${us[a.indexOf(n)].name} ${NT[n.type]||''}`));
}
