'use strict';

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const parsed = (0, _index2.default)(`
SOME_DB.CONN = (DESCRIPTION =
	(PROP1 = 1)
	(PROP2 = 2)
	(OBJ = (PROP3 = 3)))
OTHER = (SHALLOW = true)
`);

const parsedWithoutToString = Object.assign({}, parsed); // shallow copy
Object.keys(parsedWithoutToString).forEach(conn => {
	parsedWithoutToString[conn] = Object.assign({}, parsedWithoutToString[conn]); // shallow copy
	delete parsedWithoutToString[conn].toString;
});
_assert2.default.deepEqual(parsedWithoutToString, {
	'SOME_DB.CONN': {
		DESCRIPTION: {
			PROP1: 1,
			PROP2: 2,
			OBJ: { PROP3: 3 }
		}
	},
	'OTHER': {
		SHALLOW: 'true'
	}
});

_assert2.default.equal(parsed['SOME_DB.CONN'].toString(), `
(DESCRIPTION =
	(PROP1 = 1)
	(PROP2 = 2)
	(OBJ = (PROP3 = 3)))
`.replace(/\s+/g, ''));

// eslint-disable-next-line no-console
console.log('All tests passed');