export { h, g, l, o }

// ---

function h( name, attrs = {}, children = [], extra = {} ) {
	return { name, attrs, children, ...extra }
}

// should be bound before passing to render function
function g( name ) {
	return this.$get( name )
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
	console.log( 'Optimizing vnode', vnode )
	return optimize( vnode )
}

// merge sibling text into one
function optimize( vnode ) {
	const children = vnode.children || []

	const newChildren = []

	let texts = []
	children.forEach( child => {
		if ( child.type === '#text' ) {
			texts.push( child )
		} else {
			if ( texts.length > 0 ) {
				newChildren.push( h( '#text', {}, [], {
					value: texts.map( text => text.value ).join( '' )
				} ) )
				texts = []
			}

			optimize( child )

			newChildren.push( child )
		}
	} )

	vnode.children = newChildren

	return vnode
}
