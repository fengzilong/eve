export default patchAttrs

// ---

function patchAttrs( node, attrs, vnode, props ) {
	// first loop: attrs, remove
	for ( const name in attrs ) {
		if ( !( name in props ) ) {
			node.removeAttribute( name )
		}
	}

	// second loop: props, add
	for ( const name in props ) {
		node.setAttribute( name, props[ name ] )
	}
}
