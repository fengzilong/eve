import Watcher from './core/Watcher'
import Emitter from './core/Emitter'
import callHook from './core/callHook'
import createRenderFn from './core/createRenderFn'

export default Eve

// ---

class Eve extends Emitter {
	// --- constructor ---

	constructor( { data = {} } = {} ) {
		super()

		// init data
		const empty = Object.create( null )
		this.data = typeof this.data === 'function' ? this.data( empty ) : empty
		Object.assign( this.data, data )

		// merge methods, make methods extendable
		Object.assign( this, this.constructor.proto( 'methods' ) )

		// watch data changes
		const watcher = new Watcher( { context: this, path: 'data' } )
		this._watcher = watcher

		callHook( this, 'created' )
	}
}
