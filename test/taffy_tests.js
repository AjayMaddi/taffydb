/* jshint esversion: 6 */
/* Node-only test script for verifying TaffyDB security in D:\taffydb\taffy.js */

const path = require('path');
const assert = require('assert');

// 1) Load the TaffyDB module from the user-provided file path:
const { taffy } = require('C:\\sasva\\taffydb\\taffy.js');



function runTest(testName, testFn) {
  try {
    testFn();
    console.log(`✓ PASS: ${testName}`);
  } catch (err) {
    console.error(`✗ FAIL: ${testName}`);
    console.error('   ', err.message);
  }
}



function testRemoveFunction() {
  const db = taffy();
  const record = {
   
    randomFunction: () => 'hi'
  };

  db.insert(record);
  const inserted = db().first();

  assert.strictEqual(inserted.randomFunction, undefined, 'Function property should be removed');
}


function testIgnoreForgedIds() {
  const db = taffy();
  const record = {
    name: 'Testing index manipulation',
    ___id: 'FAKE_ID',
    ___s: false
  };

  db.insert(record);
  const inserted = db().first();

  // TaffyDB internally reassigns IDs; user-supplied IDs must not remain.
  assert.notStrictEqual(inserted.___id, 'FAKE_ID', 'Expected TaffyDB to override a forged ___id');
  assert.notStrictEqual(inserted.___s, false, 'Expected TaffyDB to override a forged ___s');
}


function testSimpleObjectQueries() {
  const db = taffy();
  db.insert([{ name: 'Alice'}, { name: 'Bob' }, { name: 'Carol'}]);

  // Simple query
  const results = db({ name: 'Bob' }).get();
  assert.strictEqual(results.length, 1, 'Query should find exactly one matching name');
  assert.strictEqual(results[0].name, 'Bob', 'Should retrieve the correct record');
}

function testFunctionBasedFilters() {
  const db = taffy();
  db.insert([{ x: 10 }, { x: 20 }, { x: 30 }]);
  const filterFn = function () { return this.x > 15; };
  const filtered = db(filterFn).get();
  assert.strictEqual(filtered.length, 2, 'Function-based filter found 2 records');
}


function testForgedProperties() {
  const db = taffy();
  const record = {
    name: 'Eve',
    toString: 'fake',        
    super__secret: 'shh'     
  };

  db.insert(record);
  const inserted = db().first();

  
  assert.strictEqual(typeof inserted.toString, 'string',
    'By default, "toString" as a string remains unless further restricted');
  assert.notStrictEqual(inserted.___id, undefined,
    'TaffyDB should have assigned an internal ___id');
}



(function main() {
  console.log('Running TaffyDB Security Tests under plain Node...\\n');

  
  runTest('1) Remove Function', testRemoveFunction);
  runTest('2) Ignore Forged ___id or ___s', testIgnoreForgedIds);
  runTest('3) Simple Object Queries', testSimpleObjectQueries);
  runTest('4) Function-Based Filters', testFunctionBasedFilters);
  runTest('5) Forged User-Input Properties', testForgedProperties);
 

  console.log('\\nAll checks completed. See pass/fail indicators above.\\n');
})();