import Watcher from './core/Watcher'
import Emitter from './core/Emitter'
import callHook from './core/callHook'
import compile from './compiler'
import { h, g, l, o } from './vdom/helpers'

export default Eve

// ---

class Eve extends Emitter {
	// --- constructor ---

	constructor() {
		super()

		// init data
		const empty = Object.create( null )
		this.data = typeof this.data === 'function' ? this.data( empty ) : empty

		// compile template to render function
		const { render, dependencies } = compile( this.template || '' )
		this._render = render.bind(
			this,
			h, g.bind( this ), l, o
		)
		this._dependencies = dependencies

		// watch data changes
		const watcher = new Watcher( { context: this, path: 'data' } )
		// TODO: filter updated properties, if not in dependencies, ignore
		watcher.$on( 'update', this._build.bind( this ) )
		this._watcher = watcher

		callHook( this, 'created' )
	}
}
