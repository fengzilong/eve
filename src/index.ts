import makeClass from './makeClass'
import { watchable } from './watcher'
import { emitable } from './utils/emitter'
import createRender from './vdom/render'
import patch from './vdom/patch'
import parse from './parser/index'

export default makeClass(
	// prototype
	{
		created() {}, //abstract

		attached() {}, //abstract

		detached() {}, //abstract

		disposed() {}, //abstract

		$mount() {
			this.$update()
			this.attached()
		},

		$unmount() {
			this.disposed()
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
	function () {
		emitable( this )
		watchable( this )

		// TODO: new Watcher

		this.data = {}

		this.created()

		const start = Date.now()
		console.log( parse( this.template || '' ) )
		console.log( Date.now() - start )

		const ast = parse( this.template || '' )

		const dependencies = []
		this.$watch( dependencies )

		// create render function for following rendering
		const render = createRender( ast )

		this.vdom = null
		this.$on( 'watcher:digest-end', () => {
			// collect changed path
			// TODO: computed
			const computed = {}

			const vdom = render( { ...this.data, ...computed } )
			patch( this.vdom, vdom )
			this.vdom = vdom
		} )
	}
)
