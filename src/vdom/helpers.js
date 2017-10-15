export { h, g, l, o }

// ---

function h( name, attrs = {}, children = [], extra = {} ) {
	return { name, attrs, children, ...extra }
}

// should be bound before passing to render function
function g( name, context = this ) {
	return context.$get( name )
}

function l( sequence = [], callback ) {
	const tmp = []

	let i = 0
	for ( let v of sequence ) {
		console.log( 'Looping', v, i );
		for ( let v2 of callback( v, i ) ) {
			tmp.push( v2 )
		}
		i++
	}

	return tmp
}

function o( vnode ) {
	const optimized = optimize( vnode )
	return optimized
}

// merge sibling text into one
function optimize( vnode ) {
	const children = vnode.children || []

	const newChildren = []

	let texts = []
	children.forEach( child => {
		if ( child.name === '#text' ) {
			texts.push( child )
		} else {
			if ( texts.length > 0 ) {
				mergeTexts( texts, newChildren )
			}

			optimize( child )

			newChildren.push( child )
		}
	} )

	// sometimes texts are at the end in children
	if ( texts.length > 0 ) {
		mergeTexts( texts, newChildren )
	}

	vnode.children = newChildren

	return vnode
}

function mergeTexts( texts, parent ) {
	parent.push( h( '#text', {}, [], {
		meta: {},
		value: texts.map( text => text.value ).join( '' )
	} ) )
	texts.length = 0
}
