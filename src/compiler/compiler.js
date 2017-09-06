import Parser from './parser'
import ExpressionCompiler from './expression'

export default Compiler

// ---

const ec = new ExpressionCompiler()

function compileExpression( source = '', tokens = [], options = {} ) {
	ec.parse( source, tokens, options )
	return ec.compile()
}

// ---

class Compiler {
	constructor() {
		this._parser = new Parser()
		this._source = ''
	}

	compile( source ) {
		this._source = source

		const ast = strip( this._parser.parse( source ) )
		if ( ast.length > 1 ) {
			console.error( source );
			throw new Error( `Expect an root element in template` )
		}

		return this.render( ast[ 0 ], true )
	}

	render( ast, isChildren ) {
		if ( Array.isArray( ast ) ) {
			return ast.map( this.render.bind( this ) ).join( ',' )
		}

		if ( isChildren && ast.type === 'Expression' ) {
			return this.renderExpressionAsText( ast )
		}

		return this[ ast.type ] ? this[ ast.type ]( ast ) : ''
	}

	Tag( { name, attributes, children } ) {
		const _children = this.render( children, true )
		return `_h( '${ name }', ${ JSON.stringify( attributes ) }, [ ${ _children } ] )`
	}

	IfStatement( { test, consequent, alternate } ) {
		const _test = this.render( test )
		const _consequent = consequent.length > 0 ? this.render( consequent, true ) : 'null'
		const _alternate = alternate.length > 0 ? this.render( alternate, true ) : 'null'

		return `
			${ _test } ? ${ _consequent } : ${ _alternate }
		`
	}

	EachStatement( { sequence, item, body } ) {
		const _sequence = this.render( sequence )
		const _body = this.render( body, true )
		const _item = item

		return `
			_l( ${ _sequence }, function ( ${ _item }, ${ _item }_index ) {
				return [ ${ _body } ]
			} )
		`
	}

	Text( ast ) {
		const value = ast.value
		return `_h( '#text', {}, [ '${ value.replace( /\n/g, '\\n' ).replace( /\r/g, '\\r' ) }' ] )`
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

		return `_h( '#text', {}, [ ${ compiled } ] )`
	}
}

function strip( ast ) {
	return ast.filter( v => {
		if ( v.type === 'Text' && /^\s+$/.test( v.value ) ) {
			return false
		}

		return true
	} )
}
