function compressImage(file,maxD=1920){return new Promise((res,rej)=>{
 if(!/^image\/(jpeg|png|webp)$/.test(file.type))return rej(new Error('نوع الملف غير مدعوم (JPG / PNG / WebP فقط).'));
 if(file.size>15e6)return rej(new Error('الصورة كبيرة جدًا (الحد 15MB).'));
 const img=new Image(),url=URL.createObjectURL(file);
 img.onload=()=>{const k=Math.min(1,maxD/Math.max(img.width,img.height)),w=Math.round(img.width*k),h=Math.round(img.height*k);
  const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
  let q=.85,d=c.toDataURL('image/jpeg',q);while(d.length>1.5e6&&q>.5){q-=.07;d=c.toDataURL('image/jpeg',q)}
  URL.revokeObjectURL(url);res(d)};
 img.onerror=()=>rej(new Error('تعذّر قراءة الصورة.'));img.src=url})}
