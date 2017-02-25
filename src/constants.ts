export const SVG_NAMESPACE: string = 'http://www.w3.org/2000/svg';

export const HTML_NAMESPACE: string = 'http://www.w3.org/1999/xhtml';

// https://github.com/ecomfe/san
// MIT License Copyright (c) 2016 Baidu EFE
export const SVG_TAGS: string[] = ( ''
	// structure
	+ 'svg,g,defs,desc,metadata,symbol,use,'
	// image & shape
	+ 'image,path,rect,circle,line,ellipse,polyline,polygon,'
	// text
	+ 'text,tspan,tref,textpath,'
	// other
	+ 'marker,pattern,clippath,mask,filter,cursor,view,animate,'
	// font
	+ 'font,font-face,glyph,missing-glyph' ).split( ',' );

export const SELF_CLOSE_TAGS: string[] = ''
	+ 'area,base,br,col,embed,hr,'
	+ 'img,input,keygen,link,menuitem,'
	+ 'meta,param,source,track,wbr'.split( ',' );
