import { Parser as TemplateParser } from './template'
import ExpressionCompiler from './expression'

export default Compiler

class Compiler {
	constructor() {
		this._parser = new TemplateParser( '', {
			trim: true
		} )
		this._source = ''
	}

	compile( source ) {
		this._source = source

		const ast = this._parser.parse( source )

		if ( ast.length > 1 ) {
			console.error( source )
			throw new Error( `Expect one root element in template` )
		}

		return this._render( ast[ 0 ], {
			isChildren: true
		} )
	}

	_render( ast, options = {} ) {
		options.punctuation = options.punctuation || ','

		if ( Array.isArray( ast ) ) {
			return ast.map( v => {
				return this._render( v, options )
			} ).join( options.punctuation )
		}

		return this[ ast.type ] ? this[ ast.type ]( ast, options ) : ''
	}

	Tag( { name, attributes, children } ) {
		name = JSON.stringify( name )

		const _children = this._render( children, {
			isChildren: true
		} )

		let _attrs = '{'
		let _events = '{'

		for ( const key in attributes ) {
			const rendered = this._render( attributes[ key ], {
				isAttribute: true,
				punctuation: '+'
			} )

			if ( key.indexOf( '@' ) !== 0 ) { // attrs
				_attrs += JSON.stringify( key ) + ':'
				_attrs += rendered ? rendered : `""`
				_attrs += ','
			} else { // events
				_events += JSON.stringify( key.slice( 1 ) ) + ':'
				_events += rendered
					? `function ( $e ) { return ( ${ rendered } ) }.bind( this )`
					: `function () {}`
				_events += ','
			}
		}

		// remove trailing comma
		_attrs = _attrs.replace( /,$/, '' )
		_events = _events.replace( /,$/, '' )

		_attrs += '}'
		_events += '}'

		return `_h(
			${ name },
			${ _attrs },
			[].concat( ${ _children } ),
			{
				events: ${ _events },
				meta: {
					instance: this,
					isComponent: ( ${ name } in components ),
					components: components,
					ctor: components[ ${ name } ]
				}
			}
		)`
	}

	IfStatement( { test, consequent, alternate } ) {
		const _test = this._render( test )
		const _consequent = consequent.length > 0
			? '[' + this._render( consequent, { isChildren: true } ) + ']'
			: 'null'
		const _alternate = alternate.length > 0
			? '[' + this._render( alternate, { isChildren: true } ) + ']'
			: 'null'

		return `
			${ _test } ? ${ _consequent } : ${ _alternate }
		`
	}

	EachStatement( { sequence, item, body } ) {
		const _sequence = this._render( sequence )
		const _body = '[' + this._render( body, { isChildren: true } ) + ']'
		const _item = item

		return `
			_l( ${ _sequence }, function ( ${ _item }, ${ _item }_index ) {
				return ${ _body }
			}.bind( this ) )
		`
	}

	Text( ast, options ) {
		const value = ast.value

		if ( options.isAttribute ) {
			return JSON.stringify( value )
		}

		return `
			_h( '#text', {}, [], { meta: {}, value: '${ value.replace( /\n/g, '\\n' ).replace( /\r/g, '\\r' ) }' } )
		`
	}

	// --- expression ---

	Expression( ast, options ) {
		const compiled = compileExpression( this._source, ast.tokens, {
			globals: ast.globals
		} )

		if ( options.isChildren ) {
			return `_h( '#text', {}, [], { meta: {}, value: ${ compiled } } )`
		}

		return compiled
	}
}

// ---

const c = new ExpressionCompiler()

function compileExpression( source = '', tokens = [], options = {} ) {
	c.parse( source, tokens, options )
	return c.compile()
}
