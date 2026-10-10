import { testFileParsers } from './test-file-parsers.js';
import { testStatistics } from './test-statistics.js';
import { testCleaning } from './test-cleaning.js';
import { testMLPrep } from './test-ml-prep.js';
import { testQueryEngine } from './test-query-engine.js';
import { testDiskFiles } from './test-disk-files.js';

async function runAll() {
  console.log('====================================================');
  console.log('   DataLens AI — Automated Verification Test Suite   ');
  console.log('====================================================\n');

  try {
    await testFileParsers();
    await testDiskFiles();
    testStatistics();
    testCleaning();
    testMLPrep();
    testQueryEngine();

    console.log('====================================================');
    console.log('🎉 ALL TEST SUITES PASSED CLEANLY (100% SUCCESS)');
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test suite failed with error:');
    console.error(err);
    process.exit(1);
  }
}

runAll();
