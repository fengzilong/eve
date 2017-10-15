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
		const prop = props[ name ]

		console.log( '::patchAttr', name, prop );

		if ( name !== 'ref' ) {
			node.setAttribute( name, prop )
		} else {
			vnode.meta.instance.$refs[ prop ] = node
		}
	}
}
