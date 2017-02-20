export default Emitter;
export { mixin };

// --------------------

interface StubFunction {
	stub?: Function;
}

function createMethods() {
	const all = {};

	// list from all
	function list( type: string ): Function[] {
		if ( typeof all[ type ] === 'undefined' ) {
			all[ type ] = [];
			return all[ type ];
		}

		return all[ type ];
	}

	return {
		$on( type: string, fn: Function, options: { once: boolean } = { once: false } ) {
			let stub: Function | void;

			if ( options.once ) {
				stub = () => {
					fn.apply( this, arguments );
					this.$off( type, fn );
				};
				( fn as StubFunction ).stub = stub;
			}

			list( type ).push( stub || fn );

			return this;
		},

		$off( type: string, fn?: StubFunction ) {
			const compare = fn.stub || fn;
			const array = list( type );

			array.forEach( ( handler, i ) => {
				if ( compare === handler ) {
					array.splice( i, 1 );
				}
			} );

			return this;
		},

		$once( type: string, fn: Function ) {
			return this.$on( type, fn, {
				once: true,
			} );
		},

		$emit( type: string, params: any ) {
			list( type ).forEach( fn => {
				// use context of mixined target
				fn.call( this, params );
			} );

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
