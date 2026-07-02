/*globals module, require, Buffer*/
'use strict';

var fs = require('fs');

/**
 * Decode an XML file buffer to a string, honoring a byte order mark (BOM).
 * Some programs (e.g. Finale, Sibelius) export MusicXML as UTF-16, which a plain
 * buffer.toString() garbles because it defaults to UTF-8. Decode according to the BOM
 * and strip it, so the returned string starts cleanly with "<?xml". Falls back to UTF-8.
 * @param {Buffer} buffer Raw bytes of an XML file.
 * @returns {string} The decoded XML string, with any BOM removed.
 */
var decodeXmlBuffer = function (buffer) {
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return buffer.toString('utf16le', 2); // UTF-16 little endian (common, e.g. Finale/Sibelius exports)
    }
    if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        // UTF-16 big endian: Node has no utf16be decoder, so swap the byte pairs and read as little endian
        var swapped = buffer.length % 2 === 0 ? Buffer.from(buffer).swap16() : Buffer.from(buffer);
        return swapped.toString('utf16le', 2);
    }
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return buffer.toString('utf8', 3); // UTF-8 with BOM
    }
    return buffer.toString(); // default UTF-8 (no BOM)
};

/**
 * Escape a string so it can be embedded inside a single-quoted JavaScript string literal.
 * Escapes single quotes and normalizes every line-break variant (CRLF, a lone CR, LF) to \n.
 * A lone CR left unescaped is an unescaped line break and throws a SyntaxError when the
 * generated .js is parsed, so we must not rely on \r always being paired with \n.
 * @param {string} str The string to escape.
 * @returns {string} The escaped string.
 */
var escapeString = function (str) {
    //return str.replace(/'/g, '\\\'').replace(/\r?\n/g, '\\n\' +\n    \'');
    return str.replace(/'/g, '\\\'').replace(/\r\n?|\n/g, '\\n');
};

/**
 * Create the xml2js Karma preprocessor.
 * @param {object} logger Karma logger factory (unused).
 * @param {string} basePath Karma base path, stripped from the served filename key.
 * @returns {Function} The preprocessor function (content, file, done).
 */
var createPreprocessor = function (logger, basePath) {
    var NUL = String.fromCharCode(0);
    return function (content, file, done) {
        var xml = typeof content === 'string' ? content : String(content);

        // Karma decodes file content as UTF-8 before handing it to preprocessors. A UTF-16 (LE/BE)
        // file therefore arrives garbled and riddled with NUL characters (0x00) - which are illegal
        // in XML, so their presence is a reliable signal of a mis-decode. Re-read the raw bytes from
        // disk and decode them according to the BOM instead.
        if (xml.indexOf(NUL) !== -1) {
            try {
                xml = decodeXmlBuffer(fs.readFileSync(file.originalPath));
            } catch (e) {
                // keep the (garbled) content Karma gave us rather than failing the whole test run
            }
        }

        // Strip a leading BOM character so the document starts cleanly with "<?xml" / "<"
        // (e.g. a UTF-8-with-BOM file that Karma decoded correctly but left the U+FEFF in place).
        if (xml.charCodeAt(0) === 0xFEFF) {
            xml = xml.slice(1);
        }

        var filename = file.originalPath.replace(basePath + '/', '');
        file.path = file.path + '.js';
        done("window.__xml__ = window.__xml__ || {};\nwindow.__xml__['" +
                filename + "'] = new DOMParser().parseFromString('" + escapeString(xml) +
                "', 'text/xml');\n"
              );
    };
};

createPreprocessor.$inject = ['logger', 'config.basePath'];

module.exports = {
    'preprocessor:xml2js': ['factory', createPreprocessor]
};
