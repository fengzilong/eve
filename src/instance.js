import callHook from './core/callHook'
import warning from './utils/warning'
import { createDOMNode } from './vdom/dom'
import hydrate from './vdom/hydrate'

const instance = {
	$patch() {
		const vdom = this.$render()
	},

	$mount( el ) {
		let mountNode
		if ( typeof el === 'string' ) {
			mountNode = document.querySelector( el )
		} else if ( el instanceof Node ) {
			mountNode = el
		}

		warning( mountNode, `mount node is not found` )

		this.$update()

		const vnode = this.$render()
		const mountNodeName = mountNode.nodeName.toLowerCase()
		const vnodeName = vnode.name

		if ( mountNodeName === vnodeName ) {
			hydrate( mountNode, vnode )
			this.$el = mountNode
		} else {
			const rootNode = createDOMNode( vnode )
			mountNode.parentNode.replaceChild( rootNode, mountNode )
			this.$el = rootNode
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
