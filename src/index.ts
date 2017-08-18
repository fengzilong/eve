import makeClass from './makeClass'
import { Watcher } from './watcher'
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

		this.data = {}

		this.onCreated()

		console.log( parse( this.template || '' ) )

		const { ast, dependencies } = parseTemplate( this.template || '' )

		this.$watch( dependencies )

		const render = createRender( ast )

		this.$on( '__digest:end__', () => {
			// TODO: computed
			const computed = {}
			patch( render( { ...this.data, ...computed } ) )
		} )
	}
)

function parseTemplate( template: string ): any {
	return {
		ast: [],
		dependencies: []
	}
}
