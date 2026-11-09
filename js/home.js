const IC={like:'https://cdn-icons-png.flaticon.com/128/4926/4926585.png',love:'https://cdn-icons-png.flaticon.com/128/10307/10307888.png',wow:'https://cdn-icons-png.flaticon.com/128/17446/17446042.png',dislike:'https://cdn-icons-png.flaticon.com/128/889/889139.png'};
const LBL={like:'أعجبني',love:'أحببته',wow:'رائع',dislike:'لم يعجبني'};
const ME={},UC={};let RP=null;let cursor=null,mode='all',saved={},dataURL=null;
const gu=id=>UC[id]||(UC[id]=db.ref('users/'+id).once('value').then(s=>({uid:id,...(s.val()||{name:'مستخدم'})})));
const nm=u=>esc(u.name)+(u.verified?BADGE:'');
$('#theme').onclick=toggleTheme;
$('#out').onclick=()=>auth.signOut().then(()=>location.replace('/login'));
auth.onAuthStateChanged(async u=>{
 if(!u)return location.replace('/login');
 const d=(await db.ref('users/'+u.uid).once('value')).val();
 if(!d)return auth.signOut();
 if(d.blocked)return location.replace('/block');
 Object.assign(ME,d);UC[u.uid]=Promise.resolve(ME);
 $('#me').innerHTML=av(ME)+`<div><b>${nm(ME)}</b><div class="mu">مرحبًا بك مجددًا</div></div>`;
 $('#meav').innerHTML=av(ME);
 db.ref('admins/'+u.uid).once('value').then(s=>{if(s.val()===true)$('.menu').insertAdjacentHTML('beforeend','<a href="/admin">🛡 لوحة الإدارة</a>')});
 saved=(await db.ref('favorites/'+u.uid).once('value')).val()||{};
 if(document.body.dataset.fav)mode='fav';loadFeed(true);if(typeof onReady==='function')onReady();
});
$('#more').onclick=()=>loadFeed(false);
async function loadFeed(reset){
 const feed=$('#feed');
 if(reset){cursor=null;feed.innerHTML='<div class="sk"></div><div class="sk"></div>'}
 let arr=[];
 try{
  if(mode==='fav'){
   const ids=Object.keys(saved).sort((a,b)=>saved[b]-saved[a]);
   arr=(await Promise.all(ids.map(i=>db.ref('posts/'+i).once('value')))).map(s=>s.val()).filter(Boolean);$('#more').style.display='none';
  }else{
   let q=db.ref('posts').orderByChild('createdAt');if(cursor)q=q.endAt(cursor);
   const s=await q.limitToLast(8).once('value');s.forEach(c=>{arr.push(c.val())});arr.reverse();
   if(cursor)arr=arr.filter(p=>p.createdAt<cursor);
   if(arr.length)cursor=arr[arr.length-1].createdAt;
   $('#more').style.display=arr.length>=7?'':'none';
  }
  if(reset)feed.innerHTML='';
  if(reset&&!arr.length)feed.innerHTML=`<div class="card empty">${mode==='fav'?'لم تحفظ أي صورة بعد 🔖':'لا توجد منشورات بعد — كن أول من يشارك لقطة من السماء ☁️'}</div>`;
  for(const p of arr)feed.append(await card(p));
 }catch(e){feed.innerHTML='';toast(errMsg(e),'err')}
}
async function card(p){
 const u=await gu(p.userId),el=document.createElement('article');el.className='card post';
 const mine=p.userId===ME.uid;
 el.innerHTML=`<header>${av(u)}<div class="grow"><a href="/profile?id=${u.uid}"><b>${nm(u)}</b></a><div class="mu">@${esc(u.username)} · ${ago(p.createdAt)} · 🌍</div></div>${mine?'<button class="btn ghost del" aria-label="حذف المنشور">🗑</button>':'<button class="btn ghost rp" aria-label="إبلاغ">🚩</button>'}</header>
 <div class="cap">${esc(p.caption)}</div><img class="img" loading="lazy" alt="${esc(p.caption||'صورة')}" src="${p.imageBase64}">
 <div class="stats"><span class="rc">0 تفاعل</span><span class="cc">0 تعليق</span></div>
 <div class="acts"><div class="lk"><div class="picker">${Object.keys(IC).map(k=>`<button data-r="${k}" aria-label="${LBL[k]}"><img src="${IC[k]}" alt="${LBL[k]}"></button>`).join('')}</div><button class="a lkb"><img src="${IC.like}" alt="">أعجبني</button></div>
 <div><button class="a cmb">💬 تعليق</button></div><div><button class="a sv">${saved[p.id]?'🔖 محفوظ':'📑 حفظ'}</button></div><div><button class="a dl">⬇️ حفظ الصورة</button></div></div>
 <div class="cm"><div class="cl"></div><div class="cmf"><input placeholder="اكتب تعليقًا..." aria-label="تعليق"><button class="btn">إرسال</button></div></div>`;
 const id=p.id,my=()=>$('.lkb',el);let mine_r=null;
 db.ref('reactions/'+id).on('value',s=>{const v=s.val()||{};mine_r=v[ME.uid]||null;
  $('.rc',el).textContent=Object.keys(v).length+' تفاعل';
  const b=my();b.classList.toggle('on',!!mine_r);b.innerHTML=`<img src="${IC[mine_r||'like']}" alt="">${mine_r?LBL[mine_r]:'أعجبني'}`});
 const react=t=>{const r=db.ref(`reactions/${id}/${ME.uid}`);(mine_r===t?r.remove():r.set(t).then(()=>notify(p.userId,t==='love'?'love':'like',id,`r_${ME.uid}_${id}`))).catch(e=>toast(errMsg(e),'err'))};
 el.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>react(b.dataset.r));
 my().onclick=()=>react(mine_r?mine_r:'like');
 const cl=$('.cl',el);let n=0;
 db.ref('comments/'+id).orderByChild('createdAt').on('child_added',async s=>{const c=s.val(),cu=await gu(c.userId),d=document.createElement('div');d.className='c';d.id='c'+s.key;
  d.innerHTML=`${av(cu)}<div><div class="b"><b>${nm(cu)}</b><div>${esc(c.text)}</div></div>${c.userId===ME.uid?'<button class="x">حذف</button>':''}</div>`;
  $('.x',d)&&($('.x',d).onclick=()=>db.ref(`comments/${id}/${s.key}`).remove().catch(e=>toast(errMsg(e),'err')));
  cl.append(d);$('.cc',el).textContent=++n+' تعليق'});
 db.ref('comments/'+id).on('child_removed',s=>{$('#c'+s.key,el)?.remove();$('.cc',el).textContent=--n+' تعليق'});
 $('.cmb',el).onclick=()=>$('.cm',el).classList.toggle('on');
 const inp=$('.cmf input',el),send=()=>{const t=inp.value.trim();if(!t)return;inp.value='';
  db.ref('comments/'+id).push({userId:ME.uid,text:t,createdAt:Date.now()}).then(()=>notify(p.userId,'comment',id)).catch(e=>toast(errMsg(e),'err'))};
 $('.cmf .btn',el).onclick=send;inp.onkeydown=e=>e.key==='Enter'&&send();
 $('.sv',el).onclick=async e=>{const b=e.currentTarget,r=db.ref(`favorites/${ME.uid}/${id}`);
  if(saved[id]){await r.remove();delete saved[id];b.textContent='📑 حفظ';toast('تمت الإزالة من المحفوظات');if(mode==='fav')el.remove()}
  else{saved[id]=Date.now();await r.set(saved[id]);b.textContent='🔖 محفوظ';toast('تم حفظ المنشور')}};
 $('.dl',el).onclick=async()=>{const b=await (await fetch(p.imageBase64)).blob(),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`sky7-${id}.jpg`;a.click();URL.revokeObjectURL(a.href);toast('جارٍ تنزيل الصورة')};
 const d=$('.del',el);if(d)d.onclick=async()=>{if(!confirm('حذف هذا المنشور؟'))return;
  try{await db.ref('posts/'+id).remove();db.ref('reactions/'+id).remove();db.ref('comments/'+id).remove();el.remove();toast('تم حذف المنشور')}catch(e){toast(errMsg(e),'err')}};
 const rp=$('.rp',el);if(rp)rp.onclick=()=>{RP=p;$('#rm').classList.add('on')};
 return el;
}
/* رفع الصور */
const mod=$('#mod'),bar=$('#bar'),prog=n=>{bar.style.display='block';$('i',bar).style.width=n+'%'};
const open=()=>mod.classList.add('on'),close=()=>{mod.classList.remove('on');$('#file').value='';$('#prev').style.display='none';$('#cap').value='';bar.style.display='none';dataURL=null};
['#up','#up2','#up3'].forEach(s=>$(s).onclick=open);$('#x').onclick=close;mod.onclick=e=>e.target===mod&&close();
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;
 try{prog(25);dataURL=await compressImage(f);prog(60);$('#prev').src=dataURL;$('#prev').style.display='block';setTimeout(()=>bar.style.display='none',400)}
 catch(x){toast(x.message,'err');bar.style.display='none';e.target.value='';dataURL=null}};
$('#pub').onclick=async e=>{
 if(!dataURL)return toast('اختر صورة أولًا.','err');
 const b=e.currentTarget;b.disabled=true;prog(80);
 try{const r=db.ref('posts').push(),p={id:r.key,userId:ME.uid,caption:$('#cap').value.trim(),imageBase64:dataURL,createdAt:Date.now()};
  await r.set(p);prog(100);toast('تم نشر الصورة ✨');close();
  if(mode==='all'){const f=$('#feed');f.querySelector('.empty')?.remove();f.prepend(await card(p))}
 }catch(x){toast(errMsg(x),'err')}finally{b.disabled=false}};

$('#rx').onclick=()=>$('#rm').classList.remove('on');
$('#rs').onclick=async e=>{const b=e.currentTarget;b.disabled=true;
 try{await db.ref('reports').push({reporterId:ME.uid,reportedUserId:RP.userId,postId:RP.id,reason:$('#rr').value,details:$('#rd').value.trim(),status:'pending',createdAt:Date.now()});
  toast('تم إرسال البلاغ، شكرًا لك');$('#rm').classList.remove('on');$('#rd').value=''}catch(x){toast(errMsg(x),'err')}finally{b.disabled=false}};
