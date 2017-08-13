import makeClass from './core/makeClass'
import { Watcher } from './core/watcher'

export default makeClass(
	// prototype
	{
		// abstract
		data() {},
		onCreated() {},
		onMounted() {},
		onDisposed() {},

		// public
		$mount() {
			this.onMounted()
		},

		$unmount() {
			this.onDisposed()
		},

		$update() {

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

	// constructor
	function Seed() {
		if ( typeof this.data === 'function' ) {
			this.data()
		}

		this.onCreated()
	}
)
