import Watcher from './core/Watcher'
import Emitter from './core/Emitter'
import callHook from './core/callHook'
import createRenderFn from './core/createRenderFn'

export default Eve

// ---

class Eve extends Emitter {
	// --- constructor ---

	constructor() {
		super()

		// init data
		const empty = Object.create( null )
		this.data = typeof this.data === 'function' ? this.data( empty ) : empty

		// render function
		this.$render = createRenderFn( this.template, this )

		// watch data changes
		const watcher = new Watcher( { context: this, path: 'data' } )
		this._watcher = watcher

		callHook( this, 'created' )
	}
}
