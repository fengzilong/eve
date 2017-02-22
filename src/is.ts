import { SVG_TAGS, SELF_CLOSE_TAGS } from './constants';

export function isFunction( fn ): boolean {
	return typeof fn === 'function';
};

export function isSVGTag( tagName: string ): boolean {
	return !!~SVG_TAGS.indexOf( tagName );
};

export function isSelfCloseTag( tagName: string ): boolean {
	return !!~SELF_CLOSE_TAGS.indexOf( tagName );
};
