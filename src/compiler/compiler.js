import Parser from './parser'

export default Compiler

// ---

class Compiler {
	constructor() {
		this._parser = new Parser()
	}

	compile( source ) {
		const ast = this._parser.parse( source )
		if ( ast.length > 1 ) {
			console.error( source );
			throw new Error( `Expect an root element in template` )
		}

		return this.render( ast[ 0 ] )
	}

	render( ast ) {
		if ( Array.isArray( ast ) ) {
			return ast.map( this.render.bind( this ) ).join( ',' )
		}

		const rendered = this[ ast.type ] ? this[ ast.type ]( ast ) : ''

		console.log( 'ast from ->', ast );
		console.log( 'render to ->', rendered );

		return rendered
	}

	Tag( { name, attributes, children } ) {
		const _children = this.render( children )
		return `_h( '${ name }', ${ JSON.stringify( attributes ) }, [ ${ _children } ] )`
	}

	IfStatement( { test, consequent, alternate } ) {
		const _test = this.render( test )
		const _consequent = consequent.length > 0 ? this.render( consequent ) : 'null'
		const _alternate = alternate.length > 0 ? this.render( alternate ) : 'null'

		return `
			${ _test } ? ${ _consequent } : ${ _alternate }
		`
	}

	EachStatement( { sequence, item, body } ) {
		const _sequence = this.render( sequence )
		const _body = this.render( body )
		const _item = item

		console.log( '++', body );

		return `
			_l( ${ _sequence }, function ( ${ _item }, ${ _item }_index ) {
				return ${ _body }
			} )
		`
	}

	Text( ast ) {
		const value = ast.value
		return `_h( '#text', {}, [ '${ value.replace( /\n/g, '\\n' ).replace( /\r/g, '\\r' ) }' ] )`
	}

	// --- expression ---

	Expression( ast ) {
		console.log( '--', ast );
		return ast.compile()
	}

}
