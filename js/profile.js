const qid=new URLSearchParams(location.search).get('id');let ME={},T={},cover=null,pimg=null,delCover=false;
$('#theme').onclick=toggleTheme;$('#out').onclick=()=>auth.signOut().then(()=>location.replace('/login'));
auth.onAuthStateChanged(async u=>{
 if(!u)return location.replace('/login');
 ME=(await db.ref('users/'+u.uid).once('value')).val()||{};ME.uid=u.uid;
 if(ME.blocked)return location.replace('/block');
 const tid=qid||u.uid;T=(await db.ref('users/'+tid).once('value')).val();
 if(!T)return $('#pf').innerHTML='<div class="card empty">هذا المستخدم غير موجود.</div>';
 render();
 const s=await db.ref('posts').orderByChild('userId').equalTo(tid).once('value'),a=[];s.forEach(c=>{a.push(c.val())});a.sort((x,y)=>y.createdAt-x.createdAt);
 $('#pc').textContent=a.length;
 $('#pg').innerHTML=a.map(p=>`<img loading="lazy" src="${p.imageBase64}" alt="${esc(p.caption||'صورة')}">`).join('')||'<p class="empty" style="grid-column:1/-1">لا توجد صور بعد.</p>';
});
function render(){
 const own=T.uid===ME.uid;
 $('#pf').innerHTML=`<div class="card" style="overflow:hidden"><div class="cover" style="${T.coverImage?`background-image:url(${T.coverImage})`:''}"></div>
 <div class="ph">${av(T)}<div class="in"><h1>${esc(T.name)}${T.verified?BADGE:''}</h1><div class="mu">@${esc(T.username)}${T.website?` · <a href="${esc(T.website)}" target="_blank" rel="noopener noreferrer">${esc(T.website)}</a>`:''}</div>
 <p style="margin:8px 0">${esc(T.bio)||'<span class="mu">لا توجد نبذة.</span>'}</p><div class="mu"><b id="pc">0</b> صورة</div></div>${own?'<button class="btn" id="ed">✏️ تعديل الملف الشخصي</button>':''}</div></div><div class="pg" id="pg"></div>`;
 if(own)$('#ed').onclick=openEdit;
}
const M=$('#em');
function openEdit(){const f=$('#ef');f.fn.value=T.name||'';f.un.value=T.username||'';f.web.value=T.website||'';f.bio.value=T.bio||'';cnt();cover=pimg=null;delCover=false;M.classList.add('on')}
const cnt=()=>$('#cn').textContent=$('#ef').bio.value.length+'/160';
$('#ef').bio.oninput=cnt;$('#ec').onclick=()=>M.classList.remove('on');
$('#cdel').onclick=()=>{delCover=true;cover=null;toast('سيتم حذف الغلاف عند الحفظ')};
$('#fc').onchange=async e=>{try{cover=await compressImage(e.target.files[0],1200);delCover=false;toast('تم تجهيز الغلاف')}catch(x){toast(x.message,'err')}};
$('#fp').onchange=async e=>{try{pimg=await compressImage(e.target.files[0],400);toast('تم تجهيز الصورة')}catch(x){toast(x.message,'err')}};
$('#ef').onsubmit=async e=>{e.preventDefault();const f=e.target,b=$('#es');b.disabled=true;
 let w=f.web.value.trim();if(w&&!/^https?:\/\//.test(w))w='https://'+w;
 const d={name:f.fn.value.trim(),username:f.un.value.replace(/\W/g,'').toLowerCase(),website:w,bio:f.bio.value.trim()};
 if(cover)d.coverImage=cover;else if(delCover)d.coverImage='';if(pimg)d.profileImage=pimg;
 try{await db.ref('users/'+ME.uid).update(d);Object.assign(T,d);render();M.classList.remove('on');toast('تم حفظ التغييرات');
  db.ref('posts').orderByChild('userId').equalTo(ME.uid).once('value').then(()=>{})}catch(x){toast(errMsg(x),'err')}finally{b.disabled=false}};
