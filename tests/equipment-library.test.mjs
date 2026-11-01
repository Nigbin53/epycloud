import test from 'node:test';
import {verifyEquipmentLibrary} from './equipment-library.check.mjs';

test('equipment catalog preserves independent personal records', async () => {
  await verifyEquipmentLibrary();
});
