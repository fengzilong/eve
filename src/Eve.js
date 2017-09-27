import Watcher from './core/Watcher'
import Emitter from './core/Emitter'
import callHook from './core/callHook'
import compile from './compiler'
import patch from './vdom/patch'
import { h, g, l } from './vdom/helpers'

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
		this._render = render.bind( this, h, g.bind( this ), l )
		this._dependencies = dependencies

		// watch data changes
		const watcher = new Watcher( { context: this, path: 'data' } )
		watcher.$on( 'update', this._build.bind( this ) )
		this._watcher = watcher

		callHook( this, 'created' )
	}
}
