const P=document.body.dataset.p,app=$('#app');
const T={admin:'لوحة التحكم',users:'المستخدمون',reports:'البلاغات',usercredentials:'التوثيقات'};
auth.onAuthStateChanged(async u=>{
 if(!u)return location.replace('/login');
 const a=(await db.ref('admins/'+u.uid).once('value')).val();
 if(a!==true){toast('ليست لديك صلاحية الوصول.','err');return setTimeout(()=>location.replace('/home'),1000)}
 app.innerHTML='<div class="sk"></div>';
 try{await({admin:dash,users:()=>list(false),usercredentials:()=>list(true),reports}[P])()}catch(e){app.innerHTML='';toast(errMsg(e),'err')}
});
$('#out').onclick=()=>auth.signOut().then(()=>location.replace('/login'));
const all=async()=>Object.values((await db.ref('users').once('value')).val()||{});
async function dash(){
 const [us,rp]=await Promise.all([all(),db.ref('reports').once('value')]);
 const tk=await auth.currentUser.getIdToken(),pc=await fetch(`${firebaseConfig.databaseURL}/posts.json?shallow=true&auth=${tk}`).then(r=>r.json());
 const c=[['إجمالي المستخدمين',us.length],['إجمالي المنشورات',Object.keys(pc||{}).length],['البلاغات',rp.numChildren()],['المستخدمون الموثقون',us.filter(u=>u.verified).length],['المستخدمون المحظورون',us.filter(u=>u.blocked).length]];
 app.innerHTML=`<h2>${T.admin}</h2><div class="stats4" style="margin-top:14px">${c.map(x=>`<div class="card stat"><b>${x[1]}</b>${x[0]}</div>`).join('')}</div>`;
}
async function list(cred){
 let us=await all();
 app.innerHTML=`<h2>${cred?'التوثيقات':T.users}</h2><input id="q" placeholder="بحث بالاسم أو اسم المستخدم..." aria-label="بحث" style="margin-top:12px"><div id="l"></div>`;
 const draw=()=>{const q=$('#q').value.trim().toLowerCase();
  $('#l').innerHTML=us.filter(u=>!q||(u.name+u.username).toLowerCase().includes(q)).map(u=>`<div class="card li">${av(u)}<div class="grow"><b>${esc(u.name)}${u.verified?BADGE:''}</b><div class="mu">@${esc(u.username)}${cred?'':' · '+esc(u.email)}</div></div>
  ${u.blocked?'<span class="tag">محظور</span>':''}<button class="btn sm" data-id="${u.uid}">${cred?(u.verified?'إلغاء التوثيق':'توثيق'):(u.blocked?'إلغاء الحظر':'حظر')}</button></div>`).join('')||'<p class="empty">لا نتائج.</p>';
  document.querySelectorAll('[data-id]').forEach(b=>b.onclick=async()=>{const u=us.find(x=>x.uid===b.dataset.id),k=cred?'verified':'blocked';b.disabled=true;
   try{await db.ref(`users/${u.uid}/${k}`).set(!u[k]);u[k]=!u[k];toast(cred?(u[k]?'تم توثيق الحساب':'تم إلغاء التوثيق'):(u[k]?'تم حظر المستخدم':'تم إلغاء الحظر'));draw()}catch(e){toast(errMsg(e),'err');b.disabled=false}})};
 $('#q').oninput=draw;draw();
}
async function reports(){
 const s=await db.ref('reports').once('value'),rs=[];s.forEach(c=>{rs.push({id:c.key,...c.val()})});rs.sort((a,b)=>b.createdAt-a.createdAt);
 const us={};for(const i of new Set(rs.flatMap(r=>[r.reporterId,r.reportedUserId])))us[i]=(await db.ref('users/'+i).once('value')).val()||{name:'محذوف'};
 app.innerHTML=`<h2>${T.reports}</h2><div id="l"></div>`;
 const draw=()=>{$('#l').innerHTML=rs.map(r=>`<div class="card li"><div class="grow"><b>${esc(r.reason)}</b> <span class="tag">${r.status==='pending'?'قيد المراجعة':r.status==='reviewed'?'تمت المراجعة':'تم الحظر'}</span>
  <div class="mu">المُبلِّغ: ${esc(us[r.reporterId].name)} · المُبلَّغ عنه: ${esc(us[r.reportedUserId].name)} · ${ago(r.createdAt)}</div><div>${esc(r.details)}</div></div>
  <button class="btn ghost sm" data-a="r" data-id="${r.id}">تجنب</button><button class="btn sm" data-a="b" data-id="${r.id}">حظر</button></div>`).join('')||'<p class="empty">لا توجد بلاغات.</p>';
  document.querySelectorAll('[data-id]').forEach(b=>b.onclick=async()=>{const r=rs.find(x=>x.id===b.dataset.id);b.disabled=true;
   try{if(b.dataset.a==='b'){await db.ref(`users/${r.reportedUserId}/blocked`).set(true);r.status='blocked';toast('تم حظر المستخدم')}else{r.status='reviewed';toast('تم تجاهل البلاغ')}
    await db.ref(`reports/${r.id}/status`).set(r.status);draw()}catch(e){toast(errMsg(e),'err');b.disabled=false}})};
 draw();
}
