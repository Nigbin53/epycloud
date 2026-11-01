#!/usr/bin/env python3
"""Validate the source catalog and regenerate its synchronous browser data.

Run before build_miniapp.py when equipment/library.json changes.
Stable equipment/exercise IDs must never be renamed or reused.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / '06_web-version' / 'gym-ui-kit-audited' / 'equipment'


def main():
    data = json.loads((SOURCE / 'library.json').read_text())
    assert data['schema'] == 1
    equipment = {row['id']: row for row in data['equipment']}
    exercises = {row['id']: row for row in data['exercises']}
    assert len(equipment) == len(data['equipment']), 'Duplicate equipment ID'
    assert len(exercises) == len(data['exercises']), 'Duplicate exercise ID'
    for row in equipment.values():
        assert row['id'] == 'equipment:' + row['slug']
        assert row['exerciseIds'] == [ex['id'] for ex in exercises.values() if ex['equipmentId'] == row['id']]
    for row in exercises.values():
        assert row['id'].startswith('exercise:') and row['equipmentId'] in equipment
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    (SOURCE / 'library-data.js').write_text('/* Generated from library.json. IDs are permanent; display names are editable. */\nwindow.GymMachineLibraryData=' + payload + ';\n')
    registry = {'schema': 1, 'note': 'Идентификаторы оборудования связаны с каталогом library.json. Название не определяет принадлежность личной записи.',
                'machines': [{key: row[key] for key in ('slug', 'id', 'name', 'group')} for row in equipment.values()]}
    (SOURCE / 'machines.json').write_text(json.dumps(registry, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'equipment': len(equipment), 'exercises': len(exercises)}))


if __name__ == '__main__':
    main()
