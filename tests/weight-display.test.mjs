import test from 'node:test';
import {verifyWeightDisplay} from './weight-display.check.mjs';
test('Approved weight display, real measurements and native theme fallback',async()=>{await verifyWeightDisplay();});
