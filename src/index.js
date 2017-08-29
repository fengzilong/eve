// @flow

import makeClass from './makeClass'
import { Watcher } from './watcher'
import { emitable } from './utils/emitter'
import warning from './utils/warning'
import callHook from './utils/callHook'
import createRender from './vdom/render'
import patch from './vdom/patch'
import parse from './parser/index'

export default makeClass(
	// prototype
	{
		$mount( el ) {
			if ( typeof el === 'string' ) {
				this.$el = document.querySelector( el )
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

				const vdom = render( Object.assign( {}, this.data, computed ) )
				patch( this.vdom, vdom )
				this.vdom = vdom
			}
		} )

		const dependencies = []
		this._watcher.$watch( dependencies )

		callHook( this, 'created' )
	}
)
