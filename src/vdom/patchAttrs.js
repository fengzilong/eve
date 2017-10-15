export default patchAttrs

// ---

const specials = {
	checked( node, vnode, value ) {
		node.checked = !!value
	},

	ref( node, vnode, value ) {
		vnode.meta.instance.$refs[ value ] = node
	}
}

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

		if ( name in specials ) {
			specials[ name ]( node, vnode, prop )
		} else {
			node.setAttribute( name, prop )
		}
	}
}
