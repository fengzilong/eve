import ParserError from './shared/error/ParserError'
import getCodeFrame from './shared/getCodeFrame'

export default parseExpression

// ---

class ExpressionParser {
	private source: string
	private tokens: any[]
	private exprStr: string
	private markers: { parenthesis: number }

	public parse( source = '', tokens = [] ) {
		this.source = source
		this.tokens = tokens
		this.markers = {
			parenthesis: 0
		}

		this.exprStr = ''

		return this.ternary()
	}

	// logicalOr ? ternary : ternary
	// logicalOr
	private ternary() {
		// debugger
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
			this.accept( '===' ) ||
			this.accept( '!==' ) ||
			this.accept( '==' ) ||
			this.accept( '!=' ) ||
			this.accept( '>=' ) ||
			this.accept( '<=' ) ||
			this.accept( '<' ) ||
			this.accept( '>' )
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

	// ident[ ident | string | number ]( arguments )
	// ident[ ident | string | number ]
	// ident.ident( arguments )
	// ident.ident|number
	// ident
	private member( paths?: any[] ) {
		let ident = this.accept( 'ident' )

		// first time, use [ ident ] as base
		if ( ident ) {
			return this.member( [ ident ] )
		}

		if ( paths ) {
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
					callee: paths,
					args
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

	// ( ternary )
	private parenthesis() {

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

// ---

const parser = new ExpressionParser()
function parseExpression( source, tokens ) {
	return parser.parse( source, tokens )
}
