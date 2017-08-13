import makeClass from './core/makeClass'
import { Watcher } from './core/watcher'
import { mixin as mixinEmitter } from './utils/emitter'

export default makeClass(
	// abstract + public
	{
		data() {},
		onCreated() {},
		onMounted() {},
		onDisposed() {},

		$mount() {
			this.onMounted()
			// this._disposable.add( addEvent( 'click', a ) )
		},

		$unmount() {
			this.onDisposed()
		},

		$update() {
			this._digest()
		},
	},

	// static
	{
		component() {

		},

		filter() {

		},

		directive() {

		},

		command() {

		},
	},

	function () {
		mixinEmitter( this )
	}
)
