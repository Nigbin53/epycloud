import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

// In-memory user fixtures only. Run with the built miniapp, never a live store.
export async function verifyEquipmentLibrary(root = new URL('../miniapp/', import.meta.url)) {
  const read = path => fs.readFile(new URL(path, root), 'utf8');
  const context = vm.createContext({window:{}, crypto:webcrypto, Uint32Array, Map, Set, Date, Math, JSON, Number, String, Object, Error});
  vm.runInContext(await read('equipment/library-data.js'), context);
  vm.runInContext(await read('equipment/library.js'), context);
  const lib = context.window.GymMachineLibrary;
  const plain = value => JSON.parse(JSON.stringify(value));
  const passed = [];
  function check(name, fn) { fn(); passed.push(name); }
  const catalog = plain(lib.equipment()), exercises = plain(lib.exercises());
  check('30 equipment types, 60 distinct exercise templates, all references valid', () => {
    assert.equal(catalog.length, 30); assert.equal(exercises.length, 60);
    assert.equal(new Set(catalog.map(x=>x.id)).size, 30);
    assert.equal(new Set(exercises.map(x=>x.id)).size, 60);
    exercises.forEach(x => { assert(catalog.some(eq=>eq.id===x.equipmentId)); assert(lib.modes[x.loadMode]); });
  });
  const personal = {id:1700000000000,n:'Жим ногами',g:'Ноги',w:147.5,st:2.5,s:4,r:9,img:'data:image/png;base64,personal',cover:'private-cover',h:[{w:140,t:100}],favorite:true,d:1};
  const original = plain(personal);
  const history = [{mid:personal.id,n:personal.n,g:'Ноги',w:147.5,r:9,s:4,t:200,sets:[{w:147.5,r:9}]}];
  const plans = [{id:500,name:'Ноги',days:[0],items:[personal.id]}];
  const state = {m:[personal],history:plain(history),plans:plain(plans)};
  check('migration does not claim a same-name custom machine or alter its data/history/plans', () => {
    lib.migrate(state); assert.equal(personal.origin,'custom'); assert.equal(personal.catalogId,undefined);
    const {origin,...retained}=personal; assert.deepEqual(retained, original);
    assert.deepEqual(state.history,history); assert.deepEqual(state.plans,plans);
    const migrated=JSON.stringify(state); assert.equal(lib.migrate(state),false); assert.equal(JSON.stringify(state),migrated);
  });
  let added;
  check('adding a catalog namesake creates an independent record and keeps custom photos/weights', () => {
    added=lib.create(state,'exercise:leg-press',{weight:80}); assert(added.added);
    assert.notEqual(added.machine.id,personal.id); assert.equal(added.machine.n,personal.n);
    assert.equal(added.machine.origin,'catalog'); assert.equal(added.machine.w,80); assert.equal(personal.w,147.5);
    assert.equal(personal.img,original.img); assert.equal(personal.cover,original.cover);
    assert.deepEqual(state.history,history); assert.deepEqual(state.plans,plans);
    assert.equal(lib.equipmentFor(personal),null); assert.equal(lib.equipmentFor(added.machine).id,'equipment:leg-press');
  });
  check('double tap is idempotent; another instance requires an explicit request', () => {
    const count=state.m.length; const again=lib.create(state,'exercise:leg-press');
    assert.equal(again.added,false); assert.equal(again.machine.id,added.machine.id); assert.equal(state.m.length,count);
    const another=lib.create(state,'exercise:leg-press',{another:true,location:'Другой зал'});
    assert(another.added); assert.notEqual(another.machine.id,added.machine.id); assert.equal(state.m.length,count+1);
  });
  check('renaming a catalog instance preserves its identity; equal names do not merge exercises', () => {
    added.machine.n='Мой тренажёр у окна';
    assert.equal(lib.equipmentFor(added.machine).id,'equipment:leg-press');
    const a=lib.create(state,'exercise:smith-bench'), b=lib.create(state,'exercise:smith-squat');
    b.machine.n=a.machine.n;
    assert.notEqual(a.machine.id,b.machine.id); assert.notEqual(a.machine.catalogId,b.machine.catalogId);
    assert.equal(a.machine.equipmentId,b.machine.equipmentId);
    assert.equal(lib.create(state,'Жим ногами'),null);
  });
  check('legacy seed IDs retain links after edits without touching IDs or logs', () => {
    const old={m:[{id:5,n:'Мой переименованный жим',w:123,img:'my-photo',h:[]}],history:[{mid:5,w:120}],plans:[{items:[5]}]};
    lib.migrate(old); assert.equal(old.m[0].catalogId,'exercise:leg-press'); assert.equal(old.m[0].id,5);
    assert.equal(old.m[0].n,'Мой переименованный жим'); assert.equal(old.m[0].img,'my-photo');
    assert.equal(old.history[0].mid,5); assert.equal(old.plans[0].items[0],5);
  });
  check('rapid additions have safe unique IDs and do not reuse removed history IDs', () => {
    const ids=new Set(state.m.map(x=>x.id));
    for(let i=0;i<1000;i++) {
      const row=lib.create(state,'exercise:leg-press',{another:true}).machine;
      assert(Number.isSafeInteger(row.id)); assert(!ids.has(row.id)); ids.add(row.id);
      state.history.push({mid:row.id}); state.m.pop();
    }
  });
  check('search handles Russian aliases, English aliases, yo/e, and muscle filters', () => {
    assert(lib.search('хаммер','Грудь').some(x=>x.id==='equipment:plate-chest-press'));
    assert(lib.search('lat pulldown').some(x=>x.id==='equipment:lat-pulldown'));
    assert(lib.search('лежа').some(x=>x.id==='equipment:lying-leg-curl'));
    assert(lib.search('смит','Ноги').some(x=>x.id==='equipment:smith'));
    assert.equal(lib.search('несуществующий qwerty').length,0);
  });
  check('catalog references cannot attach a catalog picture to a custom record', () => {
    assert.equal(lib.equipmentFor({...personal,catalogId:'exercise:leg-press',equipmentId:'equipment:leg-press'}),null);
    assert.equal(lib.equipmentFor({...added.machine,equipmentId:'equipment:smith'}),null);
  });
  check('new entries start without invented working weights or progress', () => {
    const model={m:[],history:[]}; const a=lib.create(model,'exercise:dumbbell-bench').machine;
    assert.equal(a.w,0); assert.equal(a.used,false); assert.equal(a.h.length,0);
    assert.equal(a.loadMode,'per-dumbbell'); assert.equal(lib.create(model,'exercise:plank').machine.loadMode,'none');
  });
  check('plans and history can display equal names unambiguously', () => {
    const a={id:101,n:'Гакк-присед',origin:'custom'}, b={id:102,n:'Гакк-присед',origin:'catalog',location:'Второй зал'};
    assert.notEqual(lib.labelFor(a,[a,b]),lib.labelFor(b,[a,b]));
    assert(lib.labelFor(a,[a,b]).includes('Свой тренажёр'));
    assert(lib.labelFor(b,[a,b]).includes('Второй зал'));
  });
  const canonical=JSON.parse(await read('equipment/library.json'));
  assert.deepEqual(plain(context.window.GymMachineLibraryData),canonical);
  passed.push('browser data matches the canonical catalog');
  const appHtml=await read('redesign/app.html');
  const deletionCode=appHtml.slice(appHtml.indexOf('function isOwnMachine(m)'),appHtml.indexOf('function screenSettings()'));
  const deletionState={m:[{id:5,origin:'catalog',n:'Жим ногами'},{id:8000000000000000,origin:'catalog',n:'Жим ногами'},{id:1700000000000,origin:'custom',n:'Жим ногами',img:'my-photo'}],history:[{mid:1700000000000,w:100}],plans:[{items:[1700000000000,5]}]};
  const deletionBefore=plain(deletionState);
  let undoDeletion;
  const deletionContext=vm.createContext({S:deletionState,save(){},render(){},renderScreenView(){},plural(){return 'тренажёр';},toast(message,undo){if(typeof undo==='function')undoDeletion=undo;}});
  vm.runInContext(deletionCode,deletionContext);
  vm.runInContext('deleteOwnMachines()',deletionContext);
  check('mass deletion and undo distinguish custom records from newly added catalog instances', () => {
    assert.deepEqual(deletionState.m.map(x=>x.id),[5,8000000000000000]);
    assert.deepEqual(deletionState.history,deletionBefore.history); assert.deepEqual(deletionState.plans,deletionBefore.plans);
    assert.equal(typeof undoDeletion,'function'); undoDeletion(); assert.deepEqual(deletionState,deletionBefore);
  });
  const slots=JSON.parse(await read('equipment/catalog.json')).slots;
  for(const item of catalog) for(const screen of ['overview','detail']) for(const theme of ['black','white']) {
    const slot=slots.find(x=>x.key===`${item.slug}/${screen}/${theme}`);
    assert(slot?.defaultUrl,`Missing picture: ${item.slug}/${screen}/${theme}`);
    const bytes=await fs.readFile(new URL(slot.defaultUrl,root)); assert(bytes.length>100);
  }
  passed.push('all equipment has existing overview/detail assets in both themes');
  // Check the actual photo store API too: names and fallback pictures are rejected.
  const files = new Map([
    ['equipment/catalog.json',JSON.parse(await read('equipment/catalog.json'))],
    ['equipment/overrides.json',JSON.parse(await read('equipment/overrides.json'))],
    ['equipment/machines.json',JSON.parse(await read('equipment/machines.json'))]
  ]);
  const photoWindow={GymMachineLibrary:lib,dispatchEvent(){},addEventListener(){}};
  const photoContext=vm.createContext({window:photoWindow,document:{currentScript:{src:'https://example.test/equipment/store.js'},addEventListener(){}},URL,Event:class Event{constructor(type){this.type=type}},Set,Map,JSON,Number,String,Array,Object,console, setInterval(){},fetch:async url=>({ok:true,json:async()=>files.get(new URL(url).pathname.slice(1))})});
  vm.runInContext(await read('equipment/store.js'),photoContext); await photoWindow.GymEquipment.ready;
  check('photo lookup uses IDs and never a same-name personal machine', () => {
    const store=photoWindow.GymEquipment;
    assert.equal(store.ownKey(personal,'overview','black'),null);
    assert.equal(store.ownKey('Жим ногами','overview','black'),null);
    assert.equal(store.photoKey(personal,'leg-press','detail','white'),null);
    assert.equal(store.ownKey(added.machine,'overview','black'),'leg-press/overview/black');
  });
  return {passed:passed.length,checks:passed};
}
