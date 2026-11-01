/* Catalog templates and personal instances have separate identities.
   Numeric instance IDs retain the existing workout/history/plan contract. */
(() => {
  'use strict';
  const data = window.GymMachineLibraryData;
  if (!data || data.schema !== 1) throw new Error('Не удалось загрузить каталог тренажёров.');
  const equipment = new Map(data.equipment.map(item => [item.id, item]));
  const exercises = new Map(data.exercises.map(item => [item.id, item]));
  const legacy = new Map(data.exercises.filter(item => item.legacySeedId).map(item => [item.legacySeedId, item]));
  const modes = Object.freeze({
    stack: {name: 'Вес стека', hint: 'Число на выбранной плитке грузового стека.'},
    plates: {name: 'Блины с двух сторон', hint: 'Общий вес установленных блинов с обеих сторон, без массы каретки.'},
    total: {name: 'Общий вес снаряда', hint: 'Вес грифа и всех блинов вместе. Для Смита учитывай массу грифа своего тренажёра.'},
    'per-dumbbell': {name: 'Вес одной гантели', hint: 'Вес одной гантели, даже если упражнение выполняется с двумя.'},
    additional: {name: 'Дополнительный вес', hint: 'Только добавленный вес. Без отягощения — 0 кг.'},
    none: {name: 'На время', hint: 'Результат записывается в секундах.'}
  });
  const copy = value => JSON.parse(JSON.stringify(value));
  const normalize = value => String(value || '').toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
  function migrate(state) {
    let changed = false;
    (state.m || []).forEach(machine => {
      if (machine.origin) return;
      // Only the nine reserved seed IDs prove catalog provenance. Names never do.
      const template = legacy.get(machine.id);
      machine.origin = template ? 'catalog' : 'custom';
      if (template) {
        machine.catalogId = template.id;
        machine.equipmentId = template.equipmentId;
        if (!machine.loadMode) machine.loadMode = template.loadMode;
      }
      changed = true;
    });
    return changed;
  }
  function nextId(state) {
    const occupied = new Set((state.m || []).map(item => item.id));
    (state.history || []).forEach(item => occupied.add(item.mid));
    (state.plans || []).forEach(plan => (plan.items || []).forEach(id => occupied.add(id)));
    let id;
    do {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const words = crypto.getRandomValues(new Uint32Array(2));
        id = 0x10000000000000 + (words[0] & 0xfffff) * 0x100000000 + words[1];
      } else {
        state.machineIdSeq = Math.max((state.machineIdSeq || 0) + 1, Date.now() * 1024 + Math.floor(Math.random() * 1024));
        id = state.machineIdSeq;
      }
    } while (occupied.has(id));
    return id;
  }
  function instances(state, templateId) {
    return (state.m || []).filter(machine => machine.origin === 'catalog' && machine.catalogId === templateId);
  }
  function create(state, templateId, options = {}) {
    const template = exercises.get(templateId);
    if (!template) return null;
    const existing = instances(state, templateId);
    if (existing.length && !options.another) return {added: false, machine: existing[0]};
    const mode = modes[options.loadMode] ? options.loadMode : template.loadMode;
    const machine = {
      id: nextId(state), origin: 'catalog', catalogId: template.id, equipmentId: template.equipmentId,
      n: String(options.name || template.name).trim().slice(0, 40) || template.name,
      g: template.group, type: template.type, loadMode: template.type === 'time' ? 'none' : template.type === 'body' ? 'additional' : mode,
      location: String(options.location || (options.another ? 'Тренажёр ' + (existing.length + 1) : '')).trim().slice(0, 40),
      w: template.type === 'time' ? 0 : Math.max(0, Math.min(1000, Number(options.weight) || 0)),
      st: [1, 2, 2.5, 5, 10].includes(Number(options.step)) ? Number(options.step) : template.step,
      s: 3, r: template.reps, h: [], d: 0, used: false
    };
    state.m.push(machine);
    return {added: true, machine};
  }
  function equipmentFor(machine) {
    if (!machine || machine.origin !== 'catalog' || !machine.catalogId) return null;
    const template = exercises.get(machine.catalogId);
    return template && template.equipmentId === machine.equipmentId ? equipment.get(template.equipmentId) || null : null;
  }
  function modeFor(machine) {
    if (machine?.type === 'time') return modes.none;
    if (machine?.type === 'body') return modes.additional;
    const template = machine?.origin === 'catalog' && exercises.get(machine.catalogId);
    return modes[machine?.loadMode] || modes[template?.loadMode] || (machine?.type === 'body' ? modes.additional : modes.total);
  }
  function sourceFor(machine, all = []) {
    const source = machine.origin === 'custom' ? 'Свой тренажёр' : 'Из каталога';
    if (machine.location) return source + ' · ' + machine.location;
    const peers = all.filter(item => normalize(item.n) === normalize(machine.n) && item.origin === machine.origin && !item.location);
    return source + (peers.length > 1 ? ' · №' + (peers.findIndex(item => item.id === machine.id) + 1) : '');
  }
  function labelFor(machine, all = []) {
    if (!machine) return '';
    const peers = all.filter(item => normalize(item.n) === normalize(machine.n));
    return machine.n + (peers.length > 1 ? ' · ' + sourceFor(machine, all) : '');
  }
  function search(query, group = 'Все') {
    const words = normalize(query).split(' ').filter(Boolean);
    return data.equipment.filter(item => {
      const children = data.exercises.filter(exercise => exercise.equipmentId === item.id);
      if (group !== 'Все' && item.group !== group && !children.some(exercise => exercise.group === group)) return false;
      const haystack = normalize([item.name, ...item.aliases, ...item.muscles, ...children.flatMap(exercise => [exercise.name, ...exercise.aliases])].join(' '));
      return words.every(word => haystack.includes(word));
    });
  }
  window.GymMachineLibrary = Object.freeze({
    revision: data.revision, modes, migrate, nextId, create, instances, equipmentFor, modeFor, sourceFor, labelFor, search, normalize,
    equipment: () => copy(data.equipment), exercises: () => copy(data.exercises),
    getEquipment: id => equipment.has(id) ? copy(equipment.get(id)) : null,
    getExercise: id => exercises.has(id) ? copy(exercises.get(id)) : null,
    exercisesFor: id => copy(data.exercises.filter(exercise => exercise.equipmentId === id))
  });
})();
