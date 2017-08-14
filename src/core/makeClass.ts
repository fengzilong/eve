export default makeClass

// ----------------------

function makeClass(
	protoProps = {},
	staticProps = {},
	target: any = () => {} // tslint:disable-line
) {
	Object.assign( target, staticProps )
	Object.assign( target.prototype, protoProps )
	target.extend = createExtend( staticProps )
	target.implement = createImplement( target.prototype )

	return target
}

interface IRegExp {
	test( string: string | Function ): boolean
}

const suprRE = ( /xyz/ as IRegExp ).test( function () { 'xyz' } ) ? /\bsupr\b/ : /.*/
const hasOwn = Object.prototype.hasOwnProperty

function createExtend( staticProps: Object ): Function {
	return function extend( definition = {} ) {
		const parent = this
		const parentProto = this.prototype

		const Child: any = function () {
			parent.apply( this, arguments )
		}
		Child.prototype = Object.create( parentProto )
		// fix prototype constructor
		Child.prototype.constructor = Child

		// add extend and implement
		Child.extend = extend
		Child.implement = createImplement( parentProto )

		// inherits static methods
		Object.assign( Child, staticProps )
		// merge to prototype
		Child.implement( definition )
		// chain parent
		Child.parent = parent

		return Child
	}
}

function createImplement( parentProto ): Function {
	return function implement( definition ) {
		const proto = this.prototype
		// assign and supr
		for ( const key in definition ) {
			if ( hasOwn.call( definition, key ) ) {

				// function and contains supr invoke
				let value = definition[ key ]
				const parentProtoValue = parentProto[ key ]
				if (
					typeof value === 'function' &&
					typeof parentProtoValue === 'function' &&
					suprRE.test( value )
				) {
					value = wrapSupr( value, parentProtoValue )
				}

				proto[ key ] = value
			}
		}
		return this
	}
}

function wrapSupr( fn: Function, parentFn: Function ): Function {
	return function () {
		// save
		const previous = this.supr
		this.supr = parentFn
		const rst = fn.apply( this, arguments )
		// recover
		this.supr = previous
		return rst
	}
}
