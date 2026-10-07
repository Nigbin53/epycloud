/* Shared redesigned application. Native private renderers and handlers are reused. */
var catalogOrigin=location.origin;
var catalogRequestedView=CATALOG_QUERY_VIEW?CATALOG_VIEW:(!CATALOG_PREVIEW&&CATALOG_ROUTES.indexOf(S.redesignLastView)>=0?S.redesignLastView:({weight:"weight",kbju:"nutrition",history:"history"}[S.tab]||CATALOG_VIEW));
var catalogReady=false,catalogNotifyTimer=null,catalogLastStatus="";
function catalogSend(type,detail){
  if(window.parent===window||catalogOrigin==="null")return;
  window.parent.postMessage(Object.assign({source:"gym-redesign-catalog",type:type,view:catalogCurrentView(),requestedView:catalogRequestedView,theme:redesignTheme},detail||{}),catalogOrigin);
}
function catalogCurrentView(){
  if(document.getElementById("obov").classList.contains("on")&&obState)return "onboarding-"+obState.step;
  if(document.getElementById("prov").classList.contains("on"))return "personal-record";
  var sheetEl=document.getElementById("sheet");
  if(document.getElementById("ov").classList.contains("on")){
    if(sheetEl.classList.contains("clrsheet"))return "clear-confirm";
    if(sheetEl.classList.contains("logsheet"))return "weight-log";
    if(cur)return cur.id===0?"machine-new":cur.ok?"record":"machine";
  }
  var top=scrStack[scrStack.length-1];
  if(top){
    if(top==="kbCamera")return KC&&KC.nocam?"camera-denied":KC&&KC.mode==="barcode"?"barcode-camera":KC&&KC.mode==="label"?"label-camera":"food-camera";
    if(top==="kbManual")return KM&&KM.ai==="fail"?"manual-fail":KM&&KM.photo==="food"?"food-photo-result":KM&&KM.photo==="barcode"?"barcode-result":KM&&KM.photo==="label"?"label-result":KM&&KM.list.length?"food-result":"food-manual";
    if(top==="kbGoals")return KG&&KG.mode==="auto"?"goals-auto":"goals";
    if(top==="kbInsights")return kbInsQual().length>=14?"insights":"insights-empty";
    return {profile:"profile",profileEdit:"profile-edit",settings:"settings",achievements:"achievements",weightStats:S.bw.length?"weight-stats":"weight-stats-empty",kbFav:"favorites",kbFavSaved:"favorites-saved",kbSetEdit:"set-edit",kbRecipe:"recipe",kbPhotoFail:"photo-fail",kbBarcodeNF:"barcode-fail"}[top]||catalogRequestedView;
  }
  if(S.tab==="workout")return S.m.length?"workout":"workout-empty";
  if(S.tab==="weight")return S.bw.length?"weight":"weight-empty";
  if(S.tab==="kbju")return kbjuSel&&kbjuSel!==kbToday()?"nutrition-past":S.food.length?"nutrition":"nutrition-empty";
  if(S.tab==="history")return histItems().length?({w:"history-workout",b:"history-weight",f:"history-food"}[histF]||"history"):"history-empty";
  return catalogRequestedView;
}
function catalogStatus(){
  var sp=document.getElementById("scrpage"),sh=document.getElementById("sheet");
  return {requestedView:catalogRequestedView,view:catalogCurrentView(),tab:S.tab,screen:scrStack[scrStack.length-1]||null,
    overlay:document.getElementById("ov").classList.contains("on")?sh.className:null,
    screenOverlay:document.getElementById("scrov").classList.contains("on")?sp.className:null,
    onboarding:document.getElementById("obov").classList.contains("on")?obState.step:null,
    storageKey:KEY,preview:CATALOG_PREVIEW,qa:CATALOG_QA,theme:redesignTheme,ready:catalogReady};
}
function catalogDayFood(day,offset){
  return [
    {id:900000+offset*10,t:keyTime(day,"08:30"),meal:"Завтрак",name:"Овсянка с бананом",g:250,kcal:310,p:9,c:55,f:6,img:""},
    {id:900001+offset*10,t:keyTime(day,"13:00"),meal:"Обед",name:"Куриная грудка с рисом",g:300,kcal:420,p:38,c:45,f:9,img:""},
    {id:900002+offset*10,t:keyTime(day,"18:30"),meal:"Ужин",name:"Говядина с гречкой",g:350,kcal:520,p:40,c:55,f:14,img:""}
  ];
}
function catalogFixtures(view){
  /* Each route uses its own namespace. These are first-load examples only. */
  if(!CATALOG_PREVIEW||!isNewUser)return;
  if(view==="workout-empty")S.m=[];
  if(view==="weight-empty"||view==="weight-stats-empty")S.bw=[];
  if(view==="nutrition-empty")S.food=[];
  if(view==="nutrition")S.food=catalogDayFood(kbToday(),0);
  if(view==="nutrition-past")S.food=catalogDayFood(keyShift(kbToday(),-1),1);
  if(view==="history-empty"){S.history=[];S.food=[];S.bw=[];}
  if(/^history(?:-|$)/.test(view)&&view!=="history-empty"||view==="clear-confirm"){
    var machine=S.m[0];
    S.history=[{mid:machine.id,n:machine.n,g:machine.g,w:machine.w,s:machine.s,r:machine.r,t:now-3600000}];
    S.food=catalogDayFood(kbToday(),0);
  }
  if(view==="insights"){
    S.food=[];S.bw=[];
    for(var i=29;i>=0;i--){
      var day=keyShift(kbToday(),-i);
      S.food=S.food.concat(catalogDayFood(day,i));
      S.bw.push({t:keyTime(day,"07:30"),w:Math.round((76-i*.035)*10)/10,fast:true});
    }
  }
  if(view==="insights-empty"){S.food=seedFood();S.bw=seedBW();}
}
function catalogShow(view){
  close();scrStack=[];KM=null;KC=null;KV=null;KG=null;KIN=null;KSE=null;KR=null;
  document.getElementById("scrov").className="scrov";
  document.getElementById("prov").classList.remove("on");
  document.getElementById("obov").classList.remove("on");
  obState=null;histF="all";kbjuSel=null;kbTargetDay=null;kbTargetMeal=null;
  S.onboarded=true;
  catalogFixtures(view);
  var nutritionViews=["nutrition","nutrition-past","nutrition-empty","food-camera","barcode-camera","label-camera","camera-denied","food-manual","food-result","food-photo-result","barcode-result","label-result","manual-fail","photo-fail","barcode-fail","favorites","favorites-saved","set-edit","recipe","goals","goals-auto","insights","insights-empty"];
  S.tab=nutritionViews.indexOf(view)>=0?"kbju":/^weight(?:-|$)/.test(view)?"weight":/^history(?:-|$)/.test(view)||view==="clear-confirm"?"history":"workout";
  if(view==="history-workout")histF="w";
  if(view==="history-weight")histF="b";
  if(view==="history-food")histF="f";
  if(view==="nutrition-past")kbjuSel=keyShift(kbToday(),-1);
  lastRenderTab=null;render();
  if(view==="machine"||view==="record"){
    if(!S.m.length){if(CATALOG_PREVIEW)S.m=seed();else{catalogReady=true;return;}}
    var selectedMachine=S.m.filter(function(m){return m.n==="Жим ногами";})[0]||S.m[0];
    open(selectedMachine.id);
    if(view==="record"){cur.ok=true;sheet();}
  }else if(view==="machine-new")open(0);
  else if(view==="weight-log"){
    logW=S.bw.length?chrono(S.bw).slice(-1)[0].w:70;logStep=.1;logDay=0;logFast=true;
    sheetLog();document.getElementById("ov").classList.add("on");
  }else if(view==="weight-stats"||view==="weight-stats-empty")openScreen("weightStats");
  else if(["food-camera","barcode-camera","label-camera","camera-denied"].indexOf(view)>=0){
    kbOpenCamera(view==="barcode-camera"?"barcode":view==="label-camera"?"label":"food");
    if(view==="camera-denied"){KC.nocam=true;kcPaint();}
  }else if(view==="food-manual")kbOpenManual({});
  else if(view==="food-result")kbOpenManual({text:"гречка и куриная грудка",items:["buck","chick"]});
  else if(view==="food-photo-result"||view==="barcode-result"||view==="label-result")kbOpenManual({photo:view==="barcode-result"?"barcode":view==="label-result"?"label":"food"});
  else if(view==="manual-fail"){
    kbOpenManual({text:"гречка и курица"});KM.ai="fail";KM.retryAdd=false;kmPaint();
  }else if(view==="photo-fail")openScreen("kbPhotoFail");
  else if(view==="barcode-fail")openScreen("kbBarcodeNF");
  else if(view==="favorites")openScreen("kbFav");
  else if(view==="favorites-saved"){
    kbFavFocus=S.kbFav.length?S.kbFav[0].id:null;openScreen("kbFavSaved");
  }else if(view==="set-edit")kbOpenSetEdit(S.kbFav.some(function(f){return f.id==="f_set1"})?"f_set1":null);
  else if(view==="recipe")kbOpenRecipe(null);
  else if(view==="goals"||view==="goals-auto"){
    kbOpenGoals({});KG.view="goals";KG.mode=view==="goals-auto"?"auto":"manual";
    if(view==="goals-auto"){KG.h=178;KG.a=28;KG.hIn="178";KG.aIn="28";KG.np=false;}
    kgPaint();
  }else if(view==="insights"||view==="insights-empty")openScreen("kbInsights");
  else if(view==="clear-confirm"){
    clrSel="all";sheetClear();document.getElementById("ov").classList.add("on");
  }else if(["profile","profile-edit","achievements","settings"].indexOf(view)>=0)openScreen(view==="profile-edit"?"profileEdit":view);
  else if(/^onboarding-[123]$/.test(view)){
    showOnboarding();obState.step=+view.slice(-1);obState.theme=S.theme;renderOb();
  }else if(view==="personal-record"){
    var m=S.m[0]||seed()[0];showPR(m.n,m.st,m.w+m.st,m.w,m.h.length?m.h[0].t:null,null);
  }
  document.getElementById("app").scrollTop=0;
  document.documentElement.dataset.catalogView=view;
  redesignMarkRoute();
  catalogReady=true;
}

/* Two skins share one source engine and one product state. Native theme enums
   stay valid; their presentation is independently owned by the redesigned kit. */
var redesignTheme=CATALOG_QUERY_THEME||((S.redesignTheme==="white"||S.redesignTheme==="black")?S.redesignTheme:"black");
var redesignLastDownload=null;
/* Keep native background selection, photo upload and dimming functional while
   mapping the two retained enum values onto the approved material palettes. */
BG_TH.g={bg:"#e8e7e2",acc:"#ff510c"};
BG_GLOW.g=["rgba(255,81,12,.055)","rgba(245,245,240,.28)","rgba(238,238,231,.06)"];
BG_TH.b={bg:"#020303",acc:"#e8edf0"};
BG_GLOW.b=["rgba(156,170,182,.08)","rgba(109,121,131,.045)","rgba(78,89,98,.02)"];
var redesignNativeBgCss=bgCss;
bgCss=function(kind,theme){
  var result=redesignNativeBgCss(kind,theme);
  return theme==="g"&&kind==="smoke"?result.replace("#1E1E20","#f4f3ee"):result;
};
function redesignApplyTheme(){
  document.documentElement.dataset.redesignTheme=redesignTheme;
  document.body.dataset.redesignTheme=redesignTheme;
  document.body.classList.toggle("theme-white",redesignTheme==="white");
  document.body.classList.toggle("theme-black",redesignTheme==="black");
}
function redesignMarkRoute(){
  var route=catalogCurrentView();
  document.documentElement.dataset.redesignRoute=route;
  document.body.dataset.redesignRoute=route;
  return route;
}
function redesignThemeControls(root){
  if(!root)return;
  root.querySelectorAll(".settthemes .obthm,.obthemecard .obthm").forEach(function(button){
    var value=button.dataset.v;
    if(value!=="b"&&value!=="g"){button.remove();return;}
    var theme=value==="b"?"black":"white",name=button.querySelector(".nm"),preview=button.querySelector(".rg");
    if(name)name.textContent=theme==="black"?"Black":"White";
    if(preview)preview.innerHTML='<span class="rd-theme-preview '+theme+'" aria-hidden="true"></span>';
    button.style.removeProperty("--tacc");
    button.dataset.redesignThemeChoice=theme;
    button.setAttribute("aria-pressed",String(theme===redesignTheme));
    button.classList.toggle("on",theme===redesignTheme);
  });
  var themeCaption=root.querySelector(".settthemes");
  if(themeCaption){
    var heading=themeCaption.parentElement.querySelector(".setth span");
    if(heading)heading.textContent=redesignTheme==="black"?"Black":"White";
  }
}
function redesignSetTheme(theme,persist){
  if(theme!=="black"&&theme!=="white")return;
  redesignTheme=theme;S.redesignTheme=theme;S.theme=theme==="black"?"b":"g";
  if(obState)obState.theme=S.theme;
  redesignApplyTheme();
  if(persist){
    save();
    var url=new URL(location.href);url.searchParams.set("theme",theme);history.replaceState(null,"",url.href);
  }
}
function redesignDownloadExport(data,filename){
  try{
    var isJson=/\.json$/i.test(filename),mime=isJson?"application/json;charset=utf-8":"text/csv;charset=utf-8";
    var blob=new Blob([isJson?data:"\uFEFF"+data],{type:mime}),downloadUrl=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=downloadUrl;link.download=filename;link.hidden=true;document.body.appendChild(link);link.click();link.remove();
    redesignLastDownload={filename:filename,mime:mime,bytes:blob.size,t:Date.now()};
    setTimeout(function(){URL.revokeObjectURL(downloadUrl);},1000);
    expDone=true;toast("Файл выгружен: "+filename);
    if(scrStack[scrStack.length-1]==="settings")renderScreenView();
    catalogSend("export",{download:redesignLastDownload});
  }catch(error){toast("Не удалось выгрузить файл");catalogSend("error",{message:String(error.message||error)});}
}
var redesignNativeApplyTheme=applyTheme;
applyTheme=function(){redesignNativeApplyTheme();redesignApplyTheme();};
var redesignNativeSettings=screenSettings;
screenSettings=function(){redesignNativeSettings();redesignThemeControls(document.getElementById("scrpage"));redesignMarkRoute();};
var redesignNativeOnboarding=renderOb;
renderOb=function(){redesignNativeOnboarding();redesignThemeControls(document.getElementById("obov"));redesignApplyTheme();redesignMarkRoute();};
/* Run before the native bubbling click handler, retaining its original action,
   validation, persistence and subsequent rerender. */
document.addEventListener("click",function(event){
  var button=event.target.closest("[data-a]");if(!button)return;
  if(button.dataset.a==="rdmachinefav"&&cur){
    var favoriteMachine=find(cur.id);favoriteMachine.favorite=!favoriteMachine.favorite;save();sheet();
  }
  if(button.dataset.a==="mfav"){
    var fm=find(+button.dataset.v);if(fm){fm.favorite=!fm.favorite;save();render();toast(fm.favorite?"В избранном":"Убрано из избранного","","«"+fm.n+"»");}
    event.stopPropagation();return;
  }
  if(button.dataset.a==="catadd"){
    var cn=button.dataset.v,cs=seed().filter(function(x){return x.n===cn})[0];
    if(cs&&!S.m.some(function(x){return x.n===cn})){cs.id=Date.now();cs.h=[];cs.d=0;S.m.push(cs);save();close();render();toast("Добавлено из каталога","","«"+cn+"»");}
    event.stopPropagation();return;
  }
  if(button.dataset.a==="rdmachinenav"){
    close();button.dataset.a="tab";
  }
  if((button.dataset.a==="theme"||button.dataset.a==="obtheme")&&(button.dataset.v==="b"||button.dataset.v==="g"))redesignSetTheme(button.dataset.v==="b"?"black":"white",true);
},true);
window.GymRedesignCatalog=Object.freeze({
  routes:Object.freeze(CATALOG_ROUTES.slice()),status:catalogStatus,
  snapshot:function(){return JSON.parse(JSON.stringify(S));},
  machineData:function(){
    if(!cur||cur.id===0)return null;
    var machine=find(cur.id),lastLog=S.history.filter(function(e){return e.mid===machine.id})[0];
    var lastText=lastLog?'Последний раз: '+f(lastLog.w)+' кг · '+lastLog.s+'×'+lastLog.r:machine.h.length?'Последний раз: '+f(machine.w)+' кг · '+machine.s+'×'+machine.r:'Ещё не записывали';
    return JSON.parse(JSON.stringify({machine:machine,working:cur,lastText:lastText,logs:S.history.filter(function(e){return e.mid===machine.id}).length,builtinPhoto:!!(cur.img&&/^data:image\/svg\+xml/.test(cur.img))}));
  },
  insightsData:function(){
    var days=kbInsSeries(KI_PER[KIN?KIN.per:1].n),sum=0;days.forEach(function(d){sum+=d.g.k});
    return JSON.parse(JSON.stringify({days:days,goalK:kbR50(sum/days.length)}));
  },
  nutritionData:function(){
    var day=kbToday(),d=new Date(keyTime(day)),T=kbTotals(dayItems(day));
    return JSON.parse(JSON.stringify({day:day,date:WD_FULL[(d.getDay()+6)%7]+', '+d.getDate()+' '+MON_GEN[d.getMonth()],goal:kbGoalFor(day),totals:T,water:kbWaterGet(day),liters:kbLiters(kbWaterGet(day)),week:kbWeek()}));
  },
  lastDownload:function(){return redesignLastDownload?Object.assign({},redesignLastDownload):null;}
});
window.addEventListener("message",function(event){
  if(event.origin!==catalogOrigin||event.source!==window.parent||!event.data||event.data.source!=="gym-catalog")return;
  var data=event.data;
  if(data.type==="open"&&CATALOG_ROUTES.indexOf(data.view)>=0&&(!data.theme||data.theme==="black"||data.theme==="white")){
    var next=new URL(location.href);next.searchParams.set("view",data.view);
    if(data.theme)next.searchParams.set("theme",data.theme);
    location.replace(next.href);
  }
});
window.addEventListener("error",function(event){catalogSend("error",{message:String(event.message||"Ошибка приложения")});});
window.addEventListener("unhandledrejection",function(event){catalogSend("error",{message:String(event.reason&&event.reason.message||event.reason||"Ошибка приложения")});});
try{
  var redesignNeedsOnboarding=!CATALOG_PREVIEW&&!CATALOG_QUERY_VIEW&&!S.onboarded;
  redesignSetTheme(redesignTheme,false);
  if(new URLSearchParams(location.search).get("embed")==="1")document.documentElement.dataset.catalogEmbed="1";
  catalogShow(catalogRequestedView);
  if(redesignNeedsOnboarding){S.onboarded=false;showOnboarding();}
  if(!CATALOG_PREVIEW)S.redesignLastView=catalogCurrentView();
  /* Persist first-load examples once: Black and White previews of this route
     read the same model instead of independently generating random history. */
  save();isNewUser=false;
  requestAnimationFrame(function(){catalogSend("ready",{status:catalogStatus()});window.dispatchEvent(new CustomEvent("gym-redesign:view",{detail:catalogStatus()}));});
  new MutationObserver(function(){
    clearTimeout(catalogNotifyTimer);catalogNotifyTimer=setTimeout(function(){
      redesignMarkRoute();
      var status=catalogStatus(),signature=JSON.stringify(status);
      if(signature!==catalogLastStatus){
        catalogLastStatus=signature;
        if(!CATALOG_PREVIEW){S.redesignLastView=status.view;save();}
        catalogSend("view",{status:status});
        window.dispatchEvent(new CustomEvent("gym-redesign:view",{detail:status}));
      }
    },60);
  }).observe(document.querySelector(".screen"),{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
}catch(redesignError){catalogReady=false;catalogSend("error",{message:String(redesignError.message||redesignError)});throw redesignError;}
