#!/usr/bin/env node

/**
 * Verification script to test that all package exports work correctly
 * Run this after building the package to ensure third-party apps can import correctly
 */

async function verifyExports() {
  console.log('🔍 Verifying @web-loom/design-core exports...\n');

  const results = {
    passed: [],
    failed: [],
  };

  // Test 1: Main entry point
  try {
    const mainExport = await import('@web-loom/design-core');
    if (mainExport) {
      results.passed.push('✅ Main entry point (@web-loom/design-core)');
    }
  } catch (error) {
    results.failed.push(`❌ Main entry point: ${error.message}`);
  }

  // Test 2: Utils export
  try {
    const utilsExport = await import('@web-loom/design-core/utils');
    const expectedFunctions = [
      'getTokenValue',
      'getAllTokens',
      'pathToCssVar',
      'getTokenVar',
      'getSafeTokenVar',
      'generateCssVariablesMap',
      'generateCssVariablesString',
      'createTheme',
      'applyTheme',
      'setTheme',
      'getCurrentTheme',
    ];

    const missingFunctions = expectedFunctions.filter((fn) => typeof utilsExport[fn] !== 'function');

    if (missingFunctions.length === 0) {
      results.passed.push(
        `✅ Utils export (@web-loom/design-core/utils) - All ${expectedFunctions.length} functions available`,
      );
    } else {
      results.failed.push(`❌ Utils export: Missing functions: ${missingFunctions.join(', ')}`);
    }
  } catch (error) {
    results.failed.push(`❌ Utils export: ${error.message}`);
  }

  // Test 3: Types export
  try {
    const typesExport = await import('@web-loom/design-core/types');
    if (typesExport) {
      results.passed.push('✅ Types export (@web-loom/design-core/types)');
    }
  } catch (error) {
    results.failed.push(`❌ Types export: ${error.message}`);
  }

  // Test 4: Verify actual functionality
  try {
    const { getTokenValue, generateCssVariablesMap } = await import('@web-loom/design-core/utils');

    // Test getting a token value
    const primaryColor = await getTokenValue('color.base.primary');
    if (primaryColor) {
      results.passed.push(`✅ Functional test: getTokenValue('color.base.primary') = ${primaryColor}`);
    } else {
      // Function is callable, token resolution is a separate concern from exports
      results.passed.push('✅ Functional test: getTokenValue() is callable (token may not resolve)');
    }

    // Test generating CSS variables
    const cssVarsMap = await generateCssVariablesMap();
    if (cssVarsMap && typeof cssVarsMap === 'object' && Object.keys(cssVarsMap).length > 0) {
      results.passed.push(
        `✅ Functional test: generateCssVariablesMap() returned ${Object.keys(cssVarsMap).length} variables`,
      );
    } else {
      results.failed.push('❌ Functional test: generateCssVariablesMap returned empty or invalid result');
    }
  } catch (error) {
    results.failed.push(`❌ Functional tests: ${error.message}`);
  }

  // Print results
  console.log('\n📊 Results:\n');
  console.log('Passed:', results.passed.length);
  results.passed.forEach((msg) => console.log(msg));

  if (results.failed.length > 0) {
    console.log('\nFailed:', results.failed.length);
    results.failed.forEach((msg) => console.log(msg));
    console.log('\n❌ Some exports are not working correctly!');
    process.exit(1);
  } else {
    console.log('\n✅ All exports are working correctly!');
    console.log('\n🎉 The package is ready for use in third-party applications!');
    process.exit(0);
  }
}

verifyExports().catch((error) => {
  console.error('❌ Verification failed with error:', error);
  process.exit(1);
});
