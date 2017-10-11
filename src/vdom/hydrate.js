import { createDOMNode } from './dom'

export default hydrate

// ---

// hydrate should applied when node and vnode has the same name
function hydrate( node, vnode ) {
	// attrs
	const attrs = [];

	[ ...( node.attributes || [] ) ].forEach( attr => {
		attrs[ attr.name ] = attr.value
	} )

	patchAttrs( node, attrs, vnode, vnode.attrs )

	// children
	let i = 0
	let childNode = node.firstChild
	let childVNode = vnode.children[ i ]

	while( childNode || childVNode ) {
		if ( !childNode ) { // real dom is missing
			node.appendChild( createDOMNode( childVNode ) )
		} else {
			const nextSibling = childNode.nextSibling

			if ( !childVNode ) { // real dom is unnecessary
				node.removeChild( childNode )
			} else { // compare two nodes
				const childNodeName = childNode.nodeName.toLowerCase()
				const childVNodeName = childVNode.name

				if ( childNodeName !== childVNodeName ) { // replace
					node.replaceChild( createDOMNode( childVNode ), childNode )
				} else if ( childNodeName === '#text' ) { // update text content
					childNode.textContent = childVNode.value
				} else { // hydrate again
					hydrate( childNode, childVNode )
				}
			}

			childNode = nextSibling
		}

		childVNode = vnode.children[ ++i ]
	}
}

function patchAttrs( node, domprops, vnode, props ) {

}

function patchEvents() {

}
