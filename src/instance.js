import callHook from './core/callHook'
import warning from './utils/warning'
import { createNodeFromVNode } from './vdom/dom'
import hydrate from './vdom/hydrate'
import compile from './compiler'
import { h, g, l, o } from './vdom/helpers'

const instance = {
	$patch() {
		const vdom = this.$render()
		console.log( 'patch::new vdom::', vdom )
		hydrate( this.$root, vdom )
	},

	$mount( selector ) {
		let mountNode
		if ( typeof selector === 'string' ) {
			mountNode = document.querySelector( selector )
		} else if ( selector instanceof Node ) {
			mountNode = selector
		}

		warning( mountNode, `mount node is not found` )

		this.$update()

		// render function
		this.$render = createRenderFn( this.template, this )
		const vnode = this.$render()
		const mountNodeName = mountNode.nodeName.toLowerCase()
		const vnodeName = vnode.name

		if ( mountNodeName === vnodeName ) {
			hydrate( mountNode, vnode )
			this.$root = mountNode
		} else {
			const rootNode = createNodeFromVNode( vnode )
			mountNode.parentNode.replaceChild( rootNode, mountNode )
			this.$root = rootNode
		}

		// watch update event after first time $update
		// TODO: filter updated properties, if not in dependencies, ignore
		this._watcher.$on( 'update', () => {
			console.log( this.$patch() )
		} )

		callHook( this, 'attached' )
	},

	$unmount() {
		callHook( this, 'disposed' )
	},

	$dispose() {

	},

	$watch( ...args ) {
		return this._watcher.$watch( ...args )
	},

	$unwatch( ...args ) {
		return this._watcher.$unwatch( ...args )
	},

	$update( ...args ) {
		return this._watcher.$update( ...args )
	},

	$get( ...args ) {
		return this._watcher.$get( ...args )
	},

	// --- private ---
}

export default instance

// ---

function createRenderFn( template, context ) {
	const { render } = compile( template || '' )
	return render.bind(
		context, // context
		h, g, l, o // helpers
	)
}
