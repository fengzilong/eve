import { SVG_TAGS, SELF_CLOSE_TAGS } from './constants'

export {
	isFunction,
	isSVGTag,
	isSelfCloseTag,
}

// ----------------

function isFunction( fn ): boolean {
	return typeof fn === 'function'
}

function isSVGTag( tagName: string ): boolean {
	return !!~SVG_TAGS.indexOf( tagName )
}

function isSelfCloseTag( tagName: string ): boolean {
	return !!~SELF_CLOSE_TAGS.indexOf( tagName )
}
