// @flow
import Token from '../shared/token'
import ParserError from '../shared/error/ParserError'
import getCodeFrame from '../shared/getCodeFrame'
import State from '../shared/state'
import GLOBALS from './globals'

export default class ExpressionCompiler {
	// --- private ---

	source: string
	tokens: any[]

	// --- public ---

	parse(
		source = '',
		tokens = [],
		{ globals = {} } = {}
	) {
		tokens.forEach( ( token, index ) => {
			token.index = index
		} )
		this.source = source
		this.tokens = tokens
		this.index = 0
		this.globals = { ...globals, ...GLOBALS }
		this.inserts = {}
		this.state = new State()

		return this.ternary()
	}

	compile() {
		return this._mergeInserts( this.tokens, this.inserts )
	}

	// --- private ---

	_mergeInserts( array, inserts ) {
		const tmp = []

		for ( let item of array ) {
			const index = item.index
			const ins = inserts[ index ] || []
			ins.filter( v => v.pos === 'before' ).map( v => v.tokens ).forEach( tokens => {
				tmp.push( ...tokens )
			} )
			tmp.push( item )
			const after = ins.filter( v => v.pos === 'after' ).map( v => v.tokens ).forEach( tokens => {
				tmp.push( ...tokens )
			} )
		}


		return tmp.map( v => v.frame ).join( '' )
	}

	// logicalOr ? ternary : ternary
	// logicalOr
	ternary() {
		const test = this.binary()

		if ( this.accept( '?' ) ) {
			const consequent = this.ternary()
			this.expect( ':' )
			const alternate = this.ternary()

			return {
				type: 'ternary',
				test,
				consequent,
				alternate
			}
		}

		return test
	}

	// unary * ternary
	// unary / ternary
	// unary % ternary
	// unary ^ ternary
	// unary
	binary() {
		const left = this.unary()

		let token
		let right

		if (
			token =
				this.accept( '+' ) ||
				this.accept( '-' ) ||

				this.accept( '*' ) ||
				this.accept( '/' ) ||
				this.accept( '%' ) ||
				this.accept( '^' ) ||

				this.accept( '===' ) ||
				this.accept( '!==' ) ||
				this.accept( '==' ) ||
				this.accept( '!=' ) ||
				this.accept( '>=' ) ||
				this.accept( '<=' ) ||
				this.accept( '<' ) ||
				this.accept( '>' ) ||

				this.accept( '&&' ) ||
				this.accept( '||' )
		) {
			return {
				type: 'binary',
				op: token.value,
				left,
				right: this.ternary()
			}
		} else if ( token = this.accept( 'ident' ) ) {
			switch ( token.value ) {
				case 'in':
				case 'instanceof':
					this.insertWhitespaceBefore( token.index )
					this.insertWhitespaceAfter( token.index )

					right = this.ternary()

					return {
						type: 'binary',
						op: token.value,
						left,
						right
					}
				case 'as':
					this.insertWhitespaceBefore( token.index )
					this.insertWhitespaceAfter( token.index )

					// disable wrap _g( ... )
					this.state.enter( 'disable_prefix_g' )
					right = this.unary()
					this.state.leave( 'disable_prefix_g' )

					return {
						type: 'binary',
						op: token.value,
						left,
						right
					}
				default:
					// skip
			}
		}

		return left
	}

	// !unary
	// ~unary
	// typeof unary
	// member|number|string
	unary() {
		let token

		if ( token = this.accept( '!' ) || this.accept( '~' ) ) {
			return {
				type: 'unary',
				op: token.value,
				body: this.unary()
			}
		} else if ( this.peek().type === 'ident' && this.peek().value === 'typeof' ) {
			const token = this.next()
			this.insertWhitespaceAfter( token.index )
			return {
				type: 'unary',
				op: 'typeof',
				body: this.unary()
			}
		} else {
			if ( token = this.accept( 'string' ) || this.accept( 'number' ) ) {
				return token
			} else {
				return this.member()
			}
		}
	}

	// primary[ ternary ]( arguments )
	// primary[ ternary ]
	// primary.ident|number( arguments )
	// primary.ident|number
	// primary
	member( paths?: any[] ) {
		if ( !paths ) {
			// only read primary as start point
			let primary = this.primary()

			// first time, use [ primary ] as base
			if ( primary ) {
				return this.member( [ primary ] )
			}

			return
		}

		const first = paths[ 0 ]
		if (
			paths.length === 1 && // is the only element in paths
			first.type === 'ident' && // is ident
			!( first.value in this.globals ) && // not in globals
			!this.state.is( 'disable_prefix_g' ) // not disabled from outside
		) {
			const index = first.index
			this.insertBefore( index, [
				new Token( 'ident', '_g', { frame: '_g' } ),
				new Token( 'symbol', '(', { frame: '(' } ),
				new Token( 'symbol', `'`, { frame: `'` } ),
			] )
			this.insertAfter( index, [
				new Token( 'symbol', `'`, { frame: `'` } ),
				new Token( 'symbol', ')', { frame: ')' } )
			] )
		}

		if ( this.accept( '.' ) ) {
			const token = this.primary()
			paths.push( token )
			return this.member( paths )
		} else if ( this.accept( '[' ) ) {
			const body = this.ternary()
			this.expect( ']' )
			paths.push( body )
			return this.member( paths )
		} else if ( this.accept( '(' ) ) {
			const args = this.arguments()
			this.expect( ')' )
			return {
				type: 'call',
				callee: {
					type: 'member',
					paths
				},
				arguments: args
			}
		} else {
			if ( paths.length === 1 ) {
				return paths[ 0 ]
			} else {
				return {
					type: 'member',
					paths
				}
			}
		}
	}

	// ternary[, ternary ]...
	arguments() {
		let token
		let ternary

		if ( ternary = this.ternary() ) {
			const ternarys = [ ternary ]

			while ( this.accept( ',' ) ) {
				if ( ternary = this.ternary() ) {
					ternarys.push( ternary )
				} else {
					ternarys.push( void 0 )
				}
			}

			return {
				type: 'arguments',
				body: ternarys
			}
		}

		return {
			type: 'arguments',
			body: []
		}
	}

	// ident
	// object
	// array
	// string
	// number
	primary() {
		const token = this.peek()

		if ( !token ) {
			return
		}

		switch ( token.type ) {
			case 'ident':
			case 'string':
			case 'number':
				return this.next()
			case 'symbol':
				switch ( token.value ) {
					case '(':
						return this.parenthesis()
					case '[':
						return this.array()
					case '{':
						return this.object()
					default:
						// empty
				}
			default:
				// empty
		}
	}

	// { ident|string|number: ternary [,ident|string|number: ternary]* }
	object() {
		const properties = []

		this.accept( '{' )

		let token
		while (
			token =
			this.accept( 'ident' ) || this.accept( 'string' ) || this.accept( 'number' )
		) {
			this.accept( ':' )
			const ternary = this.ternary()

			properties.push( {
				key: String( token.value ),
				value: ternary
			} )

			if ( !this.accept( ',' ) ) {
				break;
			}
		}

		this.expect( '}' )

		return {
			type: 'object',
			properties
		}
	}

	// [ primary [,primary]* ]
	array() {
		const elements = []

		this.accept( '[' )

		if ( this.accept( ']' ) ) {
			return {
				type: 'array',
				elements
			}
		}

		elements.push( this.ternary() )

		let token
		while ( token = this.accept( ',' ) ) {
			elements.push( this.ternary() )
		}

		this.expect( ']' )

		return {
			type: 'array',
			elements
		}
	}

	// ( ternary )
	parenthesis() {
		this.expect( '(' )
		const ternary = this.ternary()
		this.expect( ')' )

		return ternary
	}

	peek( n = 1 ) {
		return this.tokens[ this.index + n - 1 ]
	}

	next() {
		return this.tokens[ this.index++ ]
	}

	insert( index, tokens = [], pos = 'after' ) {
		const key = index
		this.inserts[ key ] = this.inserts[ key ] || [];
		this.inserts[ key ].push( {
			pos,
			tokens,
		} )
	}

	insertBefore( index, tokens = [] ) {
		this.insert( index, tokens, 'before' )
	}

	insertAfter( index, tokens = [] ) {
		this.insert( index, tokens, 'after' )
	}

	insertWhitespaceBefore( index ) {
		this.insertBefore( index, [ new Token( 'whitespace', ' ', { frame: ' ' } ) ] )
	}

	insertWhitespaceAfter( index ) {
		this.insertAfter( index, [ new Token( 'whitespace', ' ', { frame: ' ' } ) ] )
	}

	accept( type ) {
		const token = this.peek()
		if ( isTokenAcceptable( token, type ) ) {
			return this.next()
		}
	}

	expect( type ) {
		const token = this.peek()
		if ( isTokenAcceptable( token, type ) ) {
			return this.next()
		}

		const codeframe = getCodeFrame( this.source, token.pos )

		this.error( {
			message: `Expect ${ type }, but got ${ token.type }`,
			codeframe
		} )
	}

	error( err ) {
		throw new ParserError( {
			message: err.message,
			codeframe: err.codeframe
		} )
	}
}

function isTokenAcceptable( token, type ) {
	if ( !token ) {
		return false
	}

	if (
		token.type === type ||
		( token.type === 'symbol' && token.value === type )
	) {
		return true
	}

	return false
}
