import { createNodeFromVNode } from './dom'
import patchAttrs from './patchAttrs'
import connect from './connect'
import createComponent from './createComponent'

export default hydrate

// ---

// hydrate should applied when node and vnode has the same name
function hydrate( node, vnode ) {
	// connect, events will use vnode.events
	connect( node, vnode )

	// attrs
	const attrs = [];

	[ ...( node.attributes || [] ) ].forEach( attr => {
		attrs[ attr.name ] = attr.value
	} )

	patchAttrs( node, attrs, vnode, vnode.attrs )

	// events
	patchEvents()

	// children
	let i = 0
	let childNode = node.firstChild
	let childVNode = vnode.children[ i ]

	while ( childNode || childVNode ) {
		if ( !childNode ) { // real dom is missing
			node.appendChild(
				createNodeFromVNode( childVNode )
			)
			console.log( '[hydrate] append' )
		} else {
			const nextSibling = childNode.nextSibling

			if ( !childVNode ) { // real dom is unnecessary
				node.removeChild( childNode )
				console.log( '[hydrate] remove' )
			} else { // compare two nodes
				const childNodeName = childNode.nodeName.toLowerCase()
				const childVNodeName = childVNode.name
				const ctor = childVNode.meta.ctor

				if ( ctor ) { // build as component
					const instance = (
						childNode.__vnode__ &&
						childNode.__vnode__.meta &&
						childNode.__vnode__.meta.instance
					)

					if ( instance && instance instanceof ctor ) {
						console.log( '[[hydrate]] reuse instance:', childVNodeName );
						Object.assign( instance.data, childVNode.attrs )
						childNode.__vnode__.meta.instance.$update()
					} else {
						console.log( '[hydrate] create instance:', childVNodeName );
						createComponent( childNode, childVNode, ctor )
					}
				} else {
					if ( childNodeName !== childVNodeName ) { // replace
						node.replaceChild(
							createNodeFromVNode( childVNode ),
							childNode
						)
						console.log( '[hydrate] replace' )
					} else if ( childNodeName === '#text' ) { // update text content
						if ( childNode.textContent !== childVNode.value ) {
							childNode.textContent = childVNode.value
							console.log( '[hydrate] update text' );
						}
					} else { // hydrate again
						hydrate( childNode, childVNode )
					}
				}
			}

			childNode = nextSibling
		}

		childVNode = vnode.children[ ++i ]
	}
}

function patchEvents() {

}
