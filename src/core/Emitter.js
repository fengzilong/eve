// @flow
export default Emitter
export { emitable }

// ----------------------

type IStubFunction = Function & {
	once?: boolean,
	origin?: Function
}

function createMethods() {
	const all = {}

	// list from all
	function list( type: string, array?: IStubFunction[] ): IStubFunction[] {
		if ( typeof all[ type ] === 'undefined' ) {
			all[ type ] = []
		}

		if ( typeof array === 'undefined' ) {
			return all[ type ]
		}

		all[ type ] = array
		return all[ type ]
	}

	return {
		'_(:з」∠)_': all, // for debug
		$on( type: string, fn: Function, options: { once: boolean } = { once: false } ) {
			const array = list( type )

			let stub: IStubFunction | void

			if ( options.once ) {
				stub = () => {
					fn.apply( this, arguments )
				}
				stub.origin = fn
				// mark stub function as once
				stub.once = true
			}

			array.push( stub || fn )

			return this
		},

		$off( type: string, fn?: Function ) {
			const array = list( type )

			let filtered = []

			if ( typeof fn === 'function' ) {
				filtered = array.filter( ( handler, i ) => {
					if ( fn === handler || handler.origin === fn ) {
						return false
					}

					return true
				} )
			}

			list( type, filtered )

			return this
		},

		$once( type: string, fn: Function ) {
			return this.$on( type, fn, {
				once: true,
			} )
		},

		$emit( type: string, params: any ) {
			const array = list( type )

			const filtered = array.filter( ( fn, i ) => {
				// use this as context
				fn.call( this, params )
				return !fn.once
			} )

			list( type, filtered )

			return this
		},
	}
}

function emitable( target: any = {} ): void {
	if ( typeof target === 'function' ) {
		Object.assign( target.prototype, createMethods() )
	} else {
		Object.assign( target, createMethods() )
	}
}

function Emitter() {}
emitable( Emitter )
