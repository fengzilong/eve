import { Watcher } from './watcher'
import { Emitter } from './utils/emitter'
import callHook from './utils/callHook'
import compile from './compiler/compile'
import patch from './vdom/patch'

export default Eve

// ---

class Eve extends Emitter {
	// --- constructor ---

	constructor() {
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
