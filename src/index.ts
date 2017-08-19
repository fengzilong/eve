import makeClass from './makeClass'
import { watchable } from './watcher'
import { emitable } from './utils/emitter'
import createRender from './vdom/render'
import patch from './vdom/patch'
import parse from './parser'

export default makeClass(
	// prototype
	{
		onCreated() {}, //abstract

		onMounted() {}, //abstract

		onDisposed() {}, //abstract

		$mount() {
			this.$update()
			this.onMounted()
		},

		$unmount() {
			this.onDisposed()
		},

		$update() {

		},

		$watch() {

		},

		$unwatch() {

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
		emitable( this )
		watchable( this )

		this.data = {}

		this.onCreated()

		const start = Date.now()
		console.log( parse( this.template || '' ) )
		console.log( Date.now() - start )

		const ast = parse( this.template || '' )
		const dependencies = []
		this.$watch( dependencies )

		// create render function for following rendering
		const render = createRender( ast )

		this.vdom = null
		this.$on( 'digestend>ε<', () => {
			// TODO: computed
			const computed = {}

			const newVDOM = render( { ...this.data, ...computed } )
			patch( this.vdom, newVDOM )
			this.vdom = newVDOM
		} )
	}
)

function parseTemplate( template: string ): any {
	return {
		ast: [],
		dependencies: []
	}
}
