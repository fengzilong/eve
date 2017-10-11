export {
	createDOMNode,
}

function createDOMNode( vnode ) {
	if ( !vnode ) {
		return
	}

	const vnodeName = vnode.name

	if ( vnodeName === '#text' ) {
		return createTextNode( vnode.value )
	}

	const node = createNode( vnodeName, vnode.attrs )

	vnode.children.forEach( child => {
		const childNode = createDOMNode( child )
		node.append( childNode )
	} )

	return node
}

// ---

function createTextNode( content ) {
	return document.createTextNode( content )
}

// TODO: svg
function createNode( name, attrs ) {
	const node = document.createElement( name )
	Object.keys( attrs ).forEach( key => {
		if ( key.indexOf( '@' ) !== 0 ) {
			node.setAttribute( key, attrs[ key ] )
		} else {
			node.addEventListener( key.slice( 1 ), e => {
				console.log( key.slice( 1 ), 'triggered' )
			} )
		}
	} )
	return node
}
