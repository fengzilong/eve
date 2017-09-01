import warning from './utils/warning'
import callHook from './utils/callHook'

const instance = {
	$mount( el ) {
		if ( typeof el === 'string' ) {
			this.$el = document.querySelector( el )
		} else if ( el instanceof Node ) {
			this.$el = el
		}

		warning( this.$el, `mount node is not found` )

		this.$update()

		callHook( this, 'attached' )
	},

	$unmount() {
		callHook( this, 'disposed' )
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
}

export default instance
