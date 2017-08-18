import compile from './shared/compile-regex'

const _ = ( function () {
	// https://www.w3.org/TR/1999/REC-xml-names-19990114/#NT-QName
	const ncname = '[a-zA-Z_][\\w\\-\\.]*'
	const atomic = {
		TAG_NAME: `(?:${ ncname }\\:)?${ ncname }`,
		IDENT: `[\\$_a-zA-Z][\\$_0-9a-zA-Z]*`,
		BEGIN: `{`,
		END: `}`,
	}

	return compile( atomic )
} )()

/* eslint-disable */
export default {
	// TAG
	TAG_OPEN: _( /^<({{TAG_NAME}})\s*/ ),
	ATTRIBUTE: /^([-@:\.0-9a-z\(\)\[\]]+)(=(['"])*([^\3]*?)\3)?\s*/,
	TAG_END: /^(\/?)>/,
	TAG_CLOSE: _( /^<\/({{TAG_NAME}})>/ ),
	TAG_COMMENT: /^<\!--([^\x00]*?)--\>/,

	// Mustache
	MUSTACHE_OPEN: _( /^{{BEGIN}}#({{IDENT}})\s*/ ),
	MUSTACHE_END: _( /^{{END}}/ ),
	MUSTACHE_CLOSE: _( /^{{BEGIN}}\/({{IDENT}}){{END}}/ ),
	MUSTACHE_EXPRESSION_OPEN: _( /^{{BEGIN}}/ ),
	MUSTACHE_EXPRESSION_IDENT: _( /^({{IDENT}})/ ),
	MUSTACHE_EXPRESSION_NUMBER: /^((?:\d*\.\d+|\d+)(?:e\d+)?)/,
	MUSTACHE_EXPRESSION_STRING: /^(['"])([^\1]*?)\1/,
	MUSTACHE_EXPRESSION_SYMBOL: /^([=!]?==|[-=><+*\/%\!]?\=|\|\||&&|[<\>\[\]\(\)\-\|\+\*\/%?:\.!,])/,
	MUSTACHE_EXPRESSION_BRACE_OPEN: /^([{])/,
	MUSTACHE_EXPRESSION_BRACE_END: /^([}])/,

	// Others
	TEXT: /^[^\x00]/,
	WHITESPACE: /^\s+/,
}
/* eslint-enable */
