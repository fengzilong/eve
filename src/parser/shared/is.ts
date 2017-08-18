const SELF_CLOSED_TAGS = '' +
	'area,base,br,col,embed,hr,' +
	'img,input,keygen,link,menuitem,' +
	'meta,param,source,track,wbr'
	.split( ',' )

const selfClosedTagMap = {}
for ( let i = 0, len = SELF_CLOSED_TAGS.length; i < len; i++ ) {
	selfClosedTagMap[ SELF_CLOSED_TAGS[ i ] ] = true
}

export function isSelfClosedTag( tagName: string ):boolean {
	return selfClosedTagMap[ tagName ]
}
