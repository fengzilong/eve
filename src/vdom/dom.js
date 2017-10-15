import { isSVGTag } from '../utils/is'
import patchAttrs from './patchAttrs'
import connect from './connect'
import createComponent from './createComponent'

export {
	createNodeFromVNode
}

// ---

function createNodeFromVNode( vnode ) {
	if ( !vnode ) {
		return
	}

	const vnodeName = vnode.name

	if ( vnodeName === '#text' ) {
		return createTextNode( vnode.value )
	}

	const ctor = vnode.meta.ctor
	if ( !ctor ) {
		const node = createNode( vnodeName )

		// connect
		connect( node, vnode )

		patchAttrs( node, {}, vnode, vnode.attrs )

		// proxy events, using handlers in vnode.events
		Object.keys( vnode.events || {} )
			.forEach( eventName => addEvent( node, eventName ) )

		vnode.children.forEach( child => {
			const childNode = createNodeFromVNode( child )
			node.appendChild( childNode )
		} )

		return node
	} else {
		const fragment = document.createDocumentFragment()
		const root = document.createElement( 'div' )
		fragment.appendChild( root )

		createComponent( root, vnode, ctor )

		return fragment
	}
}

function addEvent( node, eventName ) {
	node.addEventListener( eventName, e => {
		// avoid reference being replaced
		const vnode = node.__vnode__
		const events = vnode.events || {}
		let fns = events[ eventName ]

		const instance = vnode.meta.instance

		if ( typeof fns === 'function' ) {
			return fns.call( instance, e )
		}

		for ( let i = 0, len = fns.length; i < len; i++ ) {
			const fn = fns[ i ]
			fn.call( instance, e )
		}
	} )
}

// ---

function createTextNode( content ) {
	return document.createTextNode( content )
}

// TODO: move isSVG to compiler
function createNode( name ) {
	if ( !isSVGTag( name ) ) {
		return document.createElement( name )
	}

	return document.createElementNS( 'http://www.w3.org/2000/svg', name )
}
