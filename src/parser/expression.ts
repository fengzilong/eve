import ParserError from './error/ParserError'
import getCodeFrame from './utils/getCodeFrame'

export default class ExpressionParser {
	private source: string
	private tokens: any[]
	private markers: { parenthesis: number }

	public parse( source = '', tokens = [] ) {
		this.source = source
		this.tokens = tokens
		this.markers = {
			parenthesis: 0
		}

		return this.ternary()
	}

	// logicalOr ? ternary : ternary
	// logicalOr
	private ternary() {
		const test = this.logicalOr()

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

	// logicalAnd || logicalOr
	private logicalOr() {
		const and = this.logicalAnd()

		if ( this.accept( '||' ) ) {
			return {
				type: 'binary',
				op: '||',
				left: and,
				right: this.logicalOr()
			}
		}

		return and
	}

	// relational && logicalAnd
	// relational
	private logicalAnd() {
		const relational = this.relational()

		if ( this.accept( '&&' ) ) {
			return {
				type: 'binary',
				op: '&&',
				left: relational,
				right: this.logicalAnd()
			}
		}

		return relational
	}

	// additive > relational
	// additive < relational
	// additive >= relational
	// additive <= relational
	// additive == relational
	// additive != relational
	// additive === relational
	// additive !== relational
	// additive
	private relational() {
		const left = this.additive()

		let token
		if (
			token = (
				this.accept( '===' ) ||
				this.accept( '!==' ) ||
				this.accept( '==' ) ||
				this.accept( '!=' ) ||
				this.accept( '>=' ) ||
				this.accept( '<=' ) ||
				this.accept( '<' ) ||
				this.accept( '>' )
			)
		) {
			return {
				type: 'binary',
				op: token.value,
				left,
				right: this.relational()
			}
		}

		return left
	}

	// multiplicative + additive
	// multiplicative - additive
	// multiplicative
	private additive() {
		const left = this.multiplicative()

		let token

		if ( token = this.accept( '+' ) || this.accept( '-' ) ) {
			return {
				type: 'binary',
				op: token.value,
				left,
				right: this.additive()
			}
		}

		return left
	}

	// unary * multiplicative
	// unary / multiplicative
	// unary % multiplicative
	// unary ^ multiplicative
	// unary
	private multiplicative() {
		const left = this.unary()

		let token

		if (
			token =
				this.accept( '*' ) ||
				this.accept( '/' ) ||
				this.accept( '%' ) ||
				this.accept( '^' )
		) {
			return {
				type: 'binary',
				op: token.value,
				left,
				right: this.multiplicative()
			}
		}

		return left
	}

	// !member
	// ~member
	// member
	// !string
	// !number
	// string
	// number
	private unary() {
		let token

		if ( token = this.accept( '!' ) || this.accept( '~' ) ) {
			return {
				type: 'unary',
				op: token.value,
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

	// primary[ ident | string | number ]( arguments )
	// primary[ ident | string | number ]
	// primary.ident( arguments )
	// primary.ident|number
	// primary
	private member( paths?: any[] ) {
		if ( !paths ) {
			// only read primary as start point
			let primary = this.primary()

			// first time, use [ primary ] as base
			if ( primary ) {
				return this.member( [ primary ] )
			}

			return
		}

		if ( this.accept( '.' ) ) {
			const token = this.expect( 'ident' )
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
	private arguments() {
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
	private primary() {
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
	private object() {
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
	private array() {
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
	private parenthesis() {
		let ternary

		if ( this.accept( '(' ) ) {
			ternary = this.ternary()
			this.expect( ')' )
		} else {
			ternary = this.ternary()
		}

		return ternary
	}

	private peek( n = 1 ) {
		return this.tokens[ --n ]
	}

	private next() {
		return this.tokens.shift()
	}

	private acceptMany( types ) {
		if ( !Array.isArray( types ) ) {
			types = [ types ]
		}

		const matchedTokens = []
		const matched = types.every( ( type, i ) => {
			const token = this.peek( i + 1 )
			if ( isTokenAcceptable( token, type ) ) {
				matchedTokens.push( token )
				return true
			}

			return false
		} )

		if ( !matched ) {
			return false
		}

		return matchedTokens
	}

	private accept( type ) {
		const token = this.peek()
		if ( isTokenAcceptable( token, type ) ) {
			return this.next()
		}
	}

	private expect( type ) {
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

	private error( err ) {
		throw new ParserError( err.message, {
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
