import callHook from './core/callHook'
import warning from './utils/warning'

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
		this._watcher.$update( ...args )
	},

	// --- private ---

	_build() {
		const data = this.data

		function _h( type, attrs, children ) {
			return { type, attrs, children }
		}

		function _g( name ) {
			return data[ name ]
		}

		function _l( sequence = [], callback ) {
			const tmp = []

			let i = 0
			for ( let v of sequence ) {
				console.log( 'looping', v, i );
				tmp.push( callback( v, i ) )
				i++
			}

			return tmp
		}

		console.log( this._render( _h, _g, _l ) )
		console.log( '__build__' )
	}
}

export default instance
