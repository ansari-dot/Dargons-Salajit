const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const imagePath = path.resolve(__dirname, '../lib/utils/image.ts');
const imageSource = fs.readFileSync(imagePath, 'utf8');
const compiledImage = ts.transpileModule(imageSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  }
}).outputText;
const imageModule = { exports: {} };
new Function('exports', 'require', 'module', '__filename', '__dirname', compiledImage)(
  imageModule.exports,
  require,
  imageModule,
  imagePath,
  path.dirname(imagePath)
);

const { resolveBackendImageUrl } = imageModule.exports;

test('resolves uploaded image URLs to the configured backend origin', () => {
  assert.equal(
    resolveBackendImageUrl('http://old-api.example/uploads/spoon.png'),
    'http://localhost:5000/uploads/spoon.png'
  );
  assert.equal(
    resolveBackendImageUrl('/uploads/package.png'),
    'http://localhost:5000/uploads/package.png'
  );
  assert.equal(
    resolveBackendImageUrl('uploads/package.png'),
    'http://localhost:5000/uploads/package.png'
  );
});

test('leaves non-upload image URLs unchanged', () => {
  assert.equal(resolveBackendImageUrl('https://images.example.com/product.png'), 'https://images.example.com/product.png');
  assert.equal(resolveBackendImageUrl('/popular_gold_jar.png'), '/popular_gold_jar.png');
  assert.equal(resolveBackendImageUrl(null), '');
});
