const firebaseConfig={apiKey:"AIzaSyDFwusZ60ZdCwNfg__YrMA6Ww25jeBOiDk",authDomain:"vid1-e2c7d.firebaseapp.com",databaseURL:"https://vid1-e2c7d-default-rtdb.firebaseio.com",projectId:"vid1-e2c7d",storageBucket:"vid1-e2c7d.firebasestorage.app",messagingSenderId:"323883326794",appId:"1:323883326794:web:e1254b899aefa6584175b3",measurementId:"G-GQHZRYG3B0"};
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth(),db=firebase.database();
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
document.documentElement.dataset.theme=localStorage.getItem('sky7-theme')||'dark';
function toggleTheme(){const t=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=t;localStorage.setItem('sky7-theme',t)}
function toast(m,t=''){let b=$('#toasts');if(!b){b=document.createElement('div');b.id='toasts';document.body.append(b)}
 const e=document.createElement('div');e.className='toast '+t;e.textContent=m;b.append(e);setTimeout(()=>e.remove(),3200)}
const ERR={'auth/invalid-credential':'بيانات تسجيل الدخول غير صحيحة.','auth/wrong-password':'بيانات تسجيل الدخول غير صحيحة.','auth/user-not-found':'بيانات تسجيل الدخول غير صحيحة.','auth/invalid-email':'البريد الإلكتروني غير صالح.','auth/email-already-in-use':'هذا البريد مستخدم بالفعل.','auth/weak-password':'كلمة المرور ضعيفة (6 أحرف على الأقل).','auth/too-many-requests':'محاولات كثيرة، حاول لاحقًا.','auth/network-request-failed':'تحقق من اتصالك بالإنترنت.','PERMISSION_DENIED':'ليست لديك صلاحية لتنفيذ هذا الإجراء.'};
const errMsg=e=>ERR[e.code]||(/permission_denied/i.test(e.message||'')?ERR.PERMISSION_DENIED:'حدث خطأ، حاول مرة أخرى.');
const BADGE='<svg class="vb" viewBox="0 0 24 24" aria-label="حساب موثق"><path fill="#1d9bf0" d="M12 1l3 2.2 3.7-.3 1.3 3.5 3 2.2-1 3.6 1 3.6-3 2.2-1.3 3.5-3.7-.3L12 23l-3-2.2-3.7.3-1.3-3.5-3-2.2 1-3.6-1-3.6 3-2.2 1.3-3.5 3.7.3z"/><path fill="none" stroke="#fff" stroke-width="2.4" d="M7.5 12.3l3 3 6-6.3"/></svg>';
const av=(u,c='av')=>u.profileImage?`<img class="${c}" src="${u.profileImage}" alt="${esc(u.name)}">`:`<span class="${c}">${esc((u.name||'؟')[0])}</span>`;
function ago(t){const s=(Date.now()-t)/1000;if(s<60)return'الآن';if(s<3600)return`منذ ${~~(s/60)} د`;if(s<86400)return`منذ ${~~(s/3600)} س`;return`منذ ${~~(s/86400)} يوم`}
