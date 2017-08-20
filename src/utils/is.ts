export {
	isFunction,
	isSVGTag,
}

// ----------------

function isFunction( fn ): boolean {
	return typeof fn === 'function'
}

// ---

// https://github.com/ecomfe/san
// MIT License Copyright (c) 2016 Baidu EFE
const SVG_TAGS: string[] = ( ''
	// structure
	+ 'svg,g,defs,desc,metadata,symbol,use,'
	// image & shape
	+ 'image,path,rect,circle,line,ellipse,polyline,polygon,'
	// text
	+ 'text,tspan,tref,textpath,'
	// other
	+ 'marker,pattern,clippath,mask,filter,cursor,view,animate,'
	// font
	+ 'font,font-face,glyph,missing-glyph' ).split( ',' )

function isSVGTag( tagName: string ): boolean {
	return !!~SVG_TAGS.indexOf( tagName )
}
