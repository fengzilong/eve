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

		let ast = this._parser.parse( source )

		if ( ast.length > 1 ) {
			console.error( source )
			throw new Error( `Expect one root element in template` )
		}

		return this._render( ast[ 0 ], true )
	}

	_render( ast, isChildren ) {
		if ( Array.isArray( ast ) ) {
			return ast.map( this._render.bind( this ) ).join( ',' )
		}

		if ( isChildren && ast.type === 'Expression' ) {
			return this.renderExpressionAsText( ast )
		}

		return this[ ast.type ] ? this[ ast.type ]( ast ) : ''
	}

	Tag( { name, attributes, children } ) {
		const _children = this._render( children, true )
		return `_h(
			'${ name }',
			${ JSON.stringify( attributes ) },
			[].concat( ${ _children } )
		)`
	}

	IfStatement( { test, consequent, alternate } ) {
		const _test = this._render( test )
		const _consequent = consequent.length > 0
			? '[' + this._render( consequent, true ) + ']'
			: 'null'
		const _alternate = alternate.length > 0
			? '[' + this._render( alternate, true ) + ']'
			: 'null'

		return `
			${ _test } ? ${ _consequent } : ${ _alternate }
		`
	}

	EachStatement( { sequence, item, body } ) {
		const _sequence = this._render( sequence )
		const _body = '[' + this._render( body, true ) + ']'
		const _item = item

		return `
			_l( ${ _sequence }, function ( ${ _item }, ${ _item }_index ) {
				return ${ _body }
			} )
		`
	}

	Text( ast ) {
		const value = ast.value
		return `
			_h( '#text', {}, [], { value: '${ value.replace( /\n/g, '\\n' ).replace( /\r/g, '\\r' ) }' } )
		`
	}

	// --- expression ---

	Expression( ast ) {
		return compileExpression( this._source, ast.tokens, {
			globals: ast.globals
		} )
	}

	renderExpressionAsText( ast ) {
		const compiled = compileExpression( this._source, ast.tokens, {
			globals: ast.globals
		} )

		return `_h( '#text', {}, [], { value: ${ compiled } } )`
	}
}

// ---

const c = new ExpressionCompiler()

function compileExpression( source = '', tokens = [], options = {} ) {
	c.parse( source, tokens, options )
	return c.compile()
}
