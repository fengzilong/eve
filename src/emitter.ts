export { Emitter, mixin };

// --------------------

interface StubFunction extends Function {
	once?: boolean;
	origin?: Function;
}

function createMethods() {
	const all = {};

	// list from all
	function list( type: string, array?: StubFunction[] ): StubFunction[] {
		if ( typeof all[ type ] === 'undefined' ) {
			all[ type ] = [];
		}

		if ( typeof array === 'undefined' ) {
			return all[ type ];
		}

		all[ type ] = array;
		return all[ type ];
	}

	return {
		$on( type: string, fn: Function, options: { once: boolean } = { once: false } ) {
			const array = list( type );

			let stub: StubFunction | void;

			if ( options.once ) {
				stub = () => {
					fn.apply( this, arguments );
				};
				stub.origin = fn;
				// mark stub function as once
				stub.once = true;
			}

			array.push( stub || fn );

			return this;
		},

		$off( type: string, fn?: Function ) {
			const array = list( type );

			let filtered = [];

			if ( typeof fn === 'function' ) {
				filtered = array.filter( ( handler, i ) => {
					if ( fn === handler || handler.origin === fn ) {
						return false;
					}

					return true;
				} );
			}

			list( type, filtered );

			return this;
		},

		$once( type: string, fn: Function ) {
			return this.$on( type, fn, {
				once: true,
			} );
		},

		$emit( type: string, params: any ) {
			const array = list( type );

			let hasOnce = false;
			const filtered = array.filter( ( fn, i ) => {
				// use this as context
				fn.call( this, params );

				if ( fn.once ) {
					hasOnce = true;
				}

				return !fn.once;
			} );

			if ( hasOnce ) {
				list( type, filtered );
			}

			return this;
		},
	};
}

function Emitter() {}
Object.assign( Emitter.prototype, createMethods() );

function mixin( target: any = {} ): void {
	if ( typeof target === 'function' ) {
		Object.assign( target.prototype, createMethods() );
	} else {
		Object.assign( target, createMethods() );
	}
}