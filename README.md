# karma-xml2js-preprocessor

Preprocessor for converting XML files into JavaScript DOM objects.

## Installation

Just run:
```bash
npm install karma-xml2js-preprocessor --save-dev
```

## Configuration
This is the default configuration:
```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    preprocessors: {
      '**/*.xml': ['xml2js']
    },
    files: [
      '**/*.xml',
      '*.js'
    ]
  });
};
```

## How does it work ?

This preprocessor converts XML files into JS DOM objects and publishes them in the global `window.__xml__`.

For instance this `doc.xml`...
```xml
<?xml version="1.0" encoding="UTF-8"?>
<tag>content</tag>
```
... will be served as `doc.xml.js`:
```js
window.__xml__ = window.__xml__ || {};
window.__xml__['doc.xml'] = /* DOM object obtained by parsing the content of doc.xml */;
```
