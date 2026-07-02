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

### Encoding / BOM support

Karma decodes file content as UTF-8 before handing it to preprocessors, which garbles files saved
as UTF-16 (e.g. MusicXML exported by Finale or Sibelius) and produces an invalid generated `.js`.
This preprocessor detects that case (UTF-16 content shows up riddled with NUL characters, which are
illegal in XML), re-reads the raw bytes from disk, and decodes them according to the byte order mark
(BOM): UTF-16 LE, UTF-16 BE, and UTF-8 with BOM are all handled, and any leading BOM is stripped so
the document starts cleanly with `<?xml`. Plain UTF-8 files are unaffected.

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
