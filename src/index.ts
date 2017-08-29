import makeClass from './makeClass'
import { Watcher } from './watcher'
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

		get $watch() {
			return this._watcher.$watch.bind( this._watcher )
		},

		get $unwatch() {
			return this._watcher.$unwatch.bind( this._watcher )
		},

		get $update() {
			return this._watcher.$update.bind( this._watcher )
		}
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

		const ast = parse( this.template || '' )

		console.log( ast )

		// create render function for following rendering
		const render = createRender( ast )

		this.data = {}
		this.vdom = null
		this._watcher = new Watcher( {
			context: this,
			onUpdate: () => {
				// collect changed path
				// TODO: computed
				const computed = {}

				const vdom = render( { ...this.data, ...computed } )
				patch( this.vdom, vdom )
				this.vdom = vdom
			}
		} )

		const dependencies = []
		this._watcher.$watch( dependencies )

		this.created()
	}
)
