import Watcher from './core/Watcher'
import Emitter from './core/Emitter'
import callHook from './utils/callHook'
import compile from './compiler/compile'
import patch from './vdom/patch'

export default Eve

// ---

class Eve extends Emitter {
	// --- constructor ---

	constructor() {
		super()

		this.data = typeof this.data === 'function' ? this.data() : {}
		this._render = compile( this.template || '' )
		this._watcher = initWatcher( { context: this } )

		callHook( this, 'created' )
	}

	// --- private ---

	_build() {

	}
}

function initWatcher ( { context } ) {
	const watcher = new Watcher( { context } )

	watcher.$watch( context.dependencies, context._build.bind( context ) )

	return watcher
}
