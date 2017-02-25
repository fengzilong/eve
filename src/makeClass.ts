export default makeClass;

// ----------------------

interface RegExp {
	test( string: string | Function ): boolean;
}

const suprRE = ( /xyz/ as RegExp ).test( function () { 'xyz'; } ) ? /\bsupr\b/ : /.*/;
const hasOwn = Object.prototype.hasOwnProperty;

function makeClass(
	protoProps = {},
	staticProps = {},
	target: any = () => {} // tslint:disable-line
) {
	Object.assign( target, staticProps );
	Object.assign( target.prototype, protoProps );
	target.extend = extend;
	target.implement = createImplement( target.prototype );

	return target;
}

function extend( definition = {} ) {
	const parent = this;
	const parentProto = this.prototype;

	const Child: any = function () {
		parent.apply( this, arguments );
	};
	Child.prototype = createPrototype( parentProto );
	// fix prototype constructor
	Child.prototype.constructor = Child;

	// add extend and implement
	Child.extend = extend;
	Child.implement = createImplement( parentProto );

	// merge to prototype
	Child.implement( definition );

	return Child;
}

function createImplement( parentProto ): Function {
	return function implement( definition ) {
		const proto = this.prototype;
		// assign and supr
		for ( const key in definition ) {
			if ( hasOwn.call( definition, key ) ) {

				// function and contains supr invoke
				let value = definition[ key ];
				const parentProtoValue = parentProto[ key ];
				if (
					typeof value === 'function' &&
					typeof parentProtoValue === 'function' &&
					suprRE.test( value )
				) {
					value = wrapParentInvoke( value, parentProtoValue );
				}

				proto[ key ] = value;
			}
		}
		return this;
	};
}

function wrapParentInvoke( fn: Function, parentFn: Function ): Function {
	return function () {
		// save
		const previous = this.supr;
		this.supr = parentFn;
		const rst = fn.apply( this, arguments );
		// recover
		this.supr = previous;
		return rst;
	};
}

function createPrototype( protoProps ) {
	function Proxy() {};
	Proxy.prototype = protoProps;
	return new Proxy();
}
