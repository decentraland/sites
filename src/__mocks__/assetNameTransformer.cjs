const path = require('path')

// Exports the file name of the asset instead of an empty stub, so specs can tell two images apart.
// Scoped in jest.config.ts to the images whose identity a spec needs to assert.
module.exports = {
  process(_sourceText, sourcePath) {
    return { code: `module.exports = ${JSON.stringify(path.basename(sourcePath))}` }
  }
}
