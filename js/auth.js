const f=$('#form'),reg=f.dataset.mode==='reg';let busy=false;
const route=async u=>{const s=await db.ref('users/'+u.uid+'/blocked').once('value');location.replace(s.val()?'/block':'/home')};
auth.onAuthStateChanged(u=>{if(u&&!busy)route(u)});
$('#eye')?.addEventListener('click',()=>{const p=$('#pass');p.type=p.type==='password'?'text':'password'});
f.addEventListener('submit',async e=>{e.preventDefault();const b=$('button.btn',f),v=n=>f[n]?.value.trim();
 b.disabled=true;const t=b.textContent;b.textContent='جارٍ التنفيذ...';busy=true;
 try{
  if(reg){
   if(v('name').length<2)throw{message:'',code:'x'};
   if(f.pass.value!==f.pass2.value){toast('كلمتا المرور غير متطابقتين.','err');return}
   const c=await auth.createUserWithEmailAndPassword(v('email'),f.pass.value);
   await db.ref('users/'+c.user.uid).set({uid:c.user.uid,name:v('name'),username:v('username').replace(/\W/g,'').toLowerCase(),email:v('email'),profileImage:'',coverImage:'',bio:'',verified:false,blocked:false,createdAt:Date.now()});
   toast('تم إنشاء حسابك بنجاح 🎉');setTimeout(()=>location.replace('/home'),600);
  }else{
   const c=await auth.signInWithEmailAndPassword(v('email'),f.pass.value);
   toast('تم تسجيل الدخول');await route(c.user);
  }
 }catch(x){toast(errMsg(x),'err')}finally{busy=false;b.disabled=false;b.textContent=t}});
