const fs = require('fs');
const path = require('path');

const tokensDir = path.join(__dirname, '../src/tokens');
const outputDir = path.join(__dirname, '../src/css');

function pathToCssVarName(tokenPath) {
  return `--${tokenPath.join('-')}`;
}

// fileTokensRoot here is actually allMergedTokens
function processTokenValue(value, allMergedTokens, currentTokenPathForLogging = []) {
  if (typeof value !== 'string') {
    return value;
  }

  const referenceRegex = /\{([^}]+?\.value)\}/g; // Matches {path.to.token.value}

  let processedValue = value.replace(referenceRegex, (match, refString) => {
    const refPathArray = refString.substring(0, refString.length - '.value'.length).split('.');

    let resolvedNode = allMergedTokens; // Start resolution from the root of all merged tokens
    for (const key of refPathArray) {
      if (resolvedNode && typeof resolvedNode === 'object' && key in resolvedNode) {
        resolvedNode = resolvedNode[key];
      } else {
        console.warn(`[Token Script] Warning for token ${pathToCssVarName(currentTokenPathForLogging)}: Reference path part "${key}" in "${refPathArray.join('.')}" not found in merged tokens. Raw segment: ${match}`);
        return match; // Return original match if path is broken
      }
    }

    if (resolvedNode && typeof resolvedNode === 'object' && 'value' in resolvedNode) {
      // Recursively process the resolved value
      return processTokenValue(resolvedNode.value, allMergedTokens, refPathArray);
    } else {
      console.warn(`[Token Script] Warning for token ${pathToCssVarName(currentTokenPathForLogging)}: Reference "${match}" resolved, but not to a token with a 'value' key. Path: ${refPathArray.join('.')}.`);
      return match; // Return original match
    }
  });

  const cssVariableRegex = /\{([^}]+?)\}/g;
  processedValue = processedValue.replace(cssVariableRegex, (match, refString) => {
    let pathArrayToConvert;
    if (refString.endsWith('.value')) {
        pathArrayToConvert = refString.substring(0, refString.length - '.value'.length).split('.');
    } else {
        pathArrayToConvert = refString.split('.');
    }
    return `var(${pathToCssVarName(pathArrayToConvert)})`;
  });

  return processedValue;
}

// tokenObj is a part of the potentially larger allMergedTokens structure
// currentPath is the path from the root of tokenObj to the current node being processed
// allMergedTokens is the global object of all tokens for reference resolution
function generateCssVariables(tokenObj, currentPath = [], allMergedTokens) {
  let cssVariables = [];
  for (const key in tokenObj) {
    if (!tokenObj.hasOwnProperty(key)) continue;

    const newPath = [...currentPath, key]; // This path is relative to the starting tokenObj for this file
    const valueNode = tokenObj[key];

    if (typeof valueNode === 'object' && valueNode !== null) {
      if ('value' in valueNode) {
        // newPath here is the correct path for the CSS variable name from the file's root key
        const varName = pathToCssVarName(newPath);
        // currentTokenPathForLogging (newPath) is also used for logging within processTokenValue
        const varValue = processTokenValue(valueNode.value, allMergedTokens, newPath);
        cssVariables.push(`  ${varName}: ${varValue};`);
      } else {
        // Pass newPath for CSS var name construction, and allMergedTokens for reference resolution
        cssVariables = cssVariables.concat(generateCssVariables(valueNode, newPath, allMergedTokens));
      }
    }
  }
  return cssVariables;
}

// Basic deep merge function
function mergeDeep(...objects) {
  const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];
      if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });
    return prev;
  }, {});
}

function main() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tokenFiles = fs.readdirSync(tokensDir).filter(file => file.endsWith('.json'));

  // 1. Load all token files into a single merged object
  let allMergedTokens = {};
  tokenFiles.forEach(file => {
    const filePath = path.join(tokensDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    try {
      const tokensInFile = JSON.parse(fileContent);
      allMergedTokens = mergeDeep(allMergedTokens, tokensInFile);
    } catch (e) {
      console.error(`Error parsing JSON from file ${file}: ${e.message}`);
    }
  });

  // 2. Generate CSS for each file, using the merged tokens for reference resolution
  tokenFiles.forEach(file => {
    const filePath = path.join(tokensDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let tokensInFile;
    try {
      tokensInFile = JSON.parse(fileContent);
    } catch (e) {
      // Already logged in the merge step, skip file if unparseable
      return;
    }

    const baseName = path.basename(file, '.json');

    // `generateCssVariables` needs to know the structure of the *current file* to create variable names correctly,
    // but `processTokenValue` needs *all* tokens to resolve references.
    // The `currentPath` in `generateCssVariables` starts from the root keys of `tokensInFile`.
    // For example, if colors.json is {"color": {...}}, path starts with "color".
    const cssVariables = generateCssVariables(tokensInFile, [], allMergedTokens);

    if (cssVariables.length > 0) {
      const cssContent = `:root {\n${cssVariables.join('\n')}\n}\n`;
      fs.writeFileSync(path.join(outputDir, `${baseName}.css`), cssContent);
      console.log(`Generated ${baseName}.css`);
    } else {
      console.log(`No variables generated for ${baseName}.css.`);
    }
  });
}

main();
