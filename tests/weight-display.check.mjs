import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

// Fixture values stay in tests. The application always passes the user's series.
export async function verifyWeightDisplay(root = new URL('../miniapp/redesign/', import.meta.url)) {
 const source=await fs.readFile(new URL('silver-weight-display.js',root),'utf8');
 const sandbox={window:{}};
 vm.runInNewContext(source,sandbox);
 const display=sandbox.window.SilverWeightDisplay;
 const pointCount=markup=>(markup.match(/class="dl-weight-point"/g)||[]).length;
 const day=86400000,date=(month,day)=>new Date(2026,month,day).getTime();
 let checks=0;
 const check=(name,fn)=>{fn();checks++;};
 const fixture={
  points:[[270,568.5],[348,568.5],[427,584],[506,595.5],[585,597],[664,585],[742,573.5],[820.5,562],[899,550],[978.5,535],[1055.5,521],[1135,505],[1214,487.5],[1291,469],[1365,452]].map(([x,y])=>({x:x-64,y:y-134})),
  dots:[0,2,4,6,8,10,12,14],colors:['#a9a9a9','#dcdcdb','#f5eaeb','#fbe9e8','#f3807a','#fc3f2d','#fb422d','#fe3824'],
  ticks:[{text:'56,5',y:225,top:214},{text:'55,5',y:397,top:386},{text:'54,5',y:568,top:557}],
  labels:[218,382,548,715,880,1045,1220].map((x,i)=>({x,text:(i+2)+' ОКТ'})),description:'Fixture'
 };
 const svg=html=>html.slice(html.indexOf('>')+1,html.indexOf('</svg>'));
 const normalize=html=>svg(html).replace(/<title[^>]*>[\s\S]*?<\/title>/,'<title/>').replaceAll(/sl-weight-reference-\d+-/g,'dl-weight-');
 const reference=await fs.readFile(new URL('./fixtures/weight-display.reference.svg',import.meta.url),'utf8');
 check('All reference SVG elements and coordinates are preserved',()=>assert.equal(normalize(display.render(fixture)),normalize(reference)));
 check('No invented values for an empty journal',()=>assert.equal(pointCount(display.render(display.chartModel([]))),0));
 check('One measurement stays one point without a fictitious line',()=>{
  const html=display.render(display.chartModel([{t:date(10,1),w:56}]));
  assert.equal(pointCount(html),1);assert(!html.includes('class="dl-weight-line"'));assert(!/NaN|Infinity/.test(html));
 });
 const entries=[{t:date(9,26),w:56},{t:date(9,8),w:55.5}];
 const original=JSON.stringify(entries),model=display.chartModel(entries),html=display.render(model);
 check('Sort and projection never mutate the journal',()=>assert.equal(JSON.stringify(entries),original));
 check('Two measurements produce exactly two dots and a straight segment',()=>{
  assert.equal(pointCount(html),2);
  assert.equal((html.match(/class="dl-weight-line"/g)||[]).length,1);
  assert(!/class="dl-weight-line" d="[^"]*[CQ]/.test(html));
  assert.equal(model.points[0].x,206);assert.equal(model.points[1].x,1301);
 });
 check('Time gaps determine point spacing',()=>{
  const m=display.chartModel([{t:date(9,1),w:55},{t:date(9,2),w:55.5},{t:date(9,11),w:56}]);
  assert.equal(m.points[1].x,315.5);
 });
 check('Flat and dense data keep all points within the chart',()=>{
  for(const values of [Array(31).fill(56),[40,100,240],Array.from({length:180},(_,i)=>60+Math.sin(i)*2)]){
   const m=display.chartModel(values.map((w,i)=>({t:date(4,1)+i*day,w})));
   assert.equal(m.points.length,values.length);
   assert(m.points.every(p=>p.y>=225&&p.y<=568));
  }
 });
 check('Every calendar month and all weight digits have vector glyphs',()=>{
  for(let month=0;month<12;month++)for(const w of [10.1,29.9,56.7,83.4,190.8]){
   const m=display.chartModel([{t:date(month,1),w},{t:date(month,8),w:w+.2}]);
   assert(!/undefined|NaN/.test(display.render(m)));
   assert(!/undefined|NaN/.test(display.render(display.chartModel([{t:date(month,1),w}],{monthly:true}))));
  }
 });
 check('Week and month keep their native actions and selected state',()=>{
  for(const range of ['week','month']){
   const h=display.render(model,{range});
   assert(h.includes('data-a="bwr" data-v="'+range+'" aria-label="'+(range==='week'?'НЕДЕЛЯ':'МЕСЯЦ')+'" aria-pressed="true"'));
  }
 });
 check('All three statistics periods remain selectable',()=>{
  for(const range of ['3m','6m','all'])assert(display.render(model,{range,action:'wsr'}).includes('data-a="wsr" data-v="'+range+'"'));
 });
 check('Multiple visible displays have independent SVG gradients and masks',()=>{
  const a=display.render(model),b=display.render(model),ids=h=>[...h.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
  assert(!ids(a).some(id=>ids(b).includes(id)));
  for(const h of [a,b])for(const m of h.matchAll(/url\(#([^)]*)\)/g))assert(ids(h).includes(m[1]));
 });
 const app=await fs.readFile(new URL('app.html',root),'utf8');
 const adapter=app.slice(app.indexOf('function silverWeightDisplay()'),app.indexOf('function axisChart('));
 check('Black and missing-component fallback still use the native renderer',()=>{
  for(const silver of [false,true]){
   const context={document:{documentElement:{hasAttribute:()=>silver}},window:{},axisChart:()=>'<svg id="native"/>',monthLabel(){},dayLabel(){}};
   vm.runInNewContext(adapter,context);
   assert(context.bodyWeightChart(entries,'week','bwr').includes('id="native"'));
  }
 });
 check('The Silver adapter binds the supplied records, range and action',()=>{
  const context={document:{documentElement:{hasAttribute:()=>true}},window:{SilverWeightDisplay:display}};
  vm.runInNewContext(adapter,context);
  assert.equal(pointCount(context.bodyWeightChart(entries,'week','bwr')),2);
 });
 return {passed:checks};
}
