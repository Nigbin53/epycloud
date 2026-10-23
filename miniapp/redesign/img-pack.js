/* Фото в памяти приложения. Всё состояние (вместе с фото) лежит в localStorage — это ~5 МБ на всё,
   и столько же уходит в синхронизацию. PNG без фона в полном цвете весит в 4–6 раз больше нужного,
   поэтому такие фото сохраняем как PNG на 256 цветов (UPNG.js + pako, MIT; грузятся только когда нужны).
   GymImg.png(canvas) → Promise<dataURL>; GymImg.compact(S) → Promise<сколько фото ужали>. */
(() => {
'use strict';
let libs=null;
function script(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.append(s);});}
function load(){
  if(window.UPNG&&window.pako)return Promise.resolve();
  if(!libs)libs=script('vendor/pako_deflate.min.js?v=1').then(()=>script('vendor/upng.js?v=1')).catch(e=>{libs=null;throw e;});
  return libs;
}
function b64(buf){const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);}
// PNG с прозрачностью → 256 цветов; если что-то пошло не так — обычный PNG
function png(c){
  const full=()=>c.toDataURL('image/png');
  return load().then(()=>{
    const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
    const out='data:image/png;base64,'+b64(window.UPNG.encode([d.buffer],c.width,c.height,256));
    const f=full();return out.length<f.length?out:f;
  }).catch(full);
}
function decode(url){return new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=url;});}
function canvasOf(im,max){const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);return c;}
// пережать тяжёлое фото: PNG → 256 цветов, JPEG → качество .7 и не больше 900 px
function shrink(url){
  if(typeof url!=='string')return Promise.resolve(null);
  const isPng=/^data:image\/png/.test(url),isJpg=/^data:image\/jpe?g/.test(url);
  if(!(isPng&&url.length>60000)&&!(isJpg&&url.length>150000))return Promise.resolve(null);
  return decode(url).then(im=>{const c=canvasOf(im,900);return isPng?png(c):c.toDataURL('image/jpeg',.7);})
    .then(u=>u&&u.length<url.length*.9?u:null).catch(()=>null);
}
// ужать фото тренажёров, своего фона и аватара прямо в состоянии
function compact(S){
  const jobs=[];
  (S.m||[]).forEach(m=>['img','cover'].forEach(k=>jobs.push(shrink(m[k]).then(u=>{if(u){m[k]=u;return 1}return 0}))));
  ['bgCustom','photo'].forEach(k=>jobs.push(shrink(S[k]).then(u=>{if(u){S[k]=u;return 1}return 0})));
  return Promise.all(jobs).then(r=>r.reduce((a,b)=>a+b,0));
}
window.GymImg={png,compact,load};
})();
