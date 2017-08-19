import State from './shared/state'
import Token from './shared/token'
import LexerError from './shared/error/LexerError'
import getCodeFrame from './shared/getCodeFrame'
import patterns from './patterns'

const hasOwn = Object.hasOwnProperty

export default class TemplateLexer {
	private source: string
	private rest: string
	private options: any
	private stash: any[]
	private pos: number
	private marker: {
		brace: number
	}
	private state: State

	constructor( source = '', options = {} ) {
		this.source = source
		this.rest = source
		this.options = options
		this.stash = []
		this.pos = 0
		this.marker = {
			brace: 0,
		}
		this.state = new State()
		this.state.enter( 'data' )
	}

	public lookahead( n ) {
		let fetch = n - this.stash.length
		while ( fetch-- > 0 ) {
			this.stash.push( this.advance() )
		}
		return this.stash[ --n ]
	}

	public peek( n = 1 ) {
		return this.lookahead( n )
	}

	public next() {
		return this.stashed() || this.advance()
	}

	private stashed() {
		return this.stash.shift()
	}

	private match( type ) {
		if ( !patterns[ type ] ) {
			return
		}
		return patterns[ type ].exec( this.rest )
	}

	private skip( len ) {
		const chunk = len[ 0 ]
		len = chunk ? chunk.length : len
		this.rest = this.rest.substr( len )
		this.pos = this.pos + len
	}

	private error( ...args ) {
		const codeframe = getCodeFrame( this.source, this.pos )
		console.error( codeframe )
		throw new LexerError( {
			codeframe,
		} )
	}

	private advance() {
		const startPos = this.pos

		const token =
			this.eos() ||
			this.whitespace() ||
			this.tagOpen() ||
			this.tagEnd() ||
			this.tagClose() ||
			this.attribute() ||
			this.mustacheOpen() ||
			this.mustacheClose() ||
			this.interpolationOpen() ||
			// expression should be placed after `enter state mustacheOpen`
			this.expression() ||
			this.comment() ||
			this.text()

		const endPos = this.pos

		token.pos = startPos
		token.frame = this.source.slice( startPos, endPos )

		// console.log( 'advance', token )

		return token
	}

	private comment() {
		const captures = this.match( 'TAG_COMMENT' )
		if ( captures ) {
			this.skip( captures )
			const content = captures[ 1 ]
			return new Token( 'comment', { content } )
		}
	}
	private tagOpen() {
		const captures = this.match( 'TAG_OPEN' )
		if ( captures ) {
			this.skip( captures )
			const name = captures[ 1 ]
			this.state.enter( 'tagOpen' )
			return new Token( 'tagOpen', { name } )
		}
	}
	private attribute() {
		if ( !this.state.is( 'tagOpen' ) ) {
			return
		}

		const captures = this.match( 'ATTRIBUTE' )

		if ( captures ) {
			this.skip( captures )
			const name = captures[ 1 ]
			const value = captures[ 4 ]
			return new Token( 'attribute', { name, value } )
		}
	}
	private tagEnd() {
		const captures = this.match( 'TAG_END' )
		if ( captures ) {
			this.skip( captures )
			this.state.leave( 'tagOpen' )
			const isSelfClosed = Boolean( captures[ 1 ] )
			return new Token( 'tagEnd', {
				isSelfClosed,
			} )
		}
	}
	private tagClose() {
		const captures = this.match( 'TAG_CLOSE' )
		if ( captures ) {
			this.skip( captures )
			const tagname = captures[ 1 ]
			return new Token( 'tagClose', {
				name: tagname,
			} )
		}
	}
	// mustache
	private mustacheOpen() {
		const captures = this.match( 'MUSTACHE_OPEN' )
		if ( captures ) {
			const name = captures[ 1 ]
			this.skip( captures )
			this.state.enter( 'mustacheOpen' )
			return new Token( 'mustacheOpen', name )
		}
	}
	private mustacheEnd() {
		if ( !this.state.is( 'mustacheOpen' ) ) {
			return
		}

		const captures = this.match( 'MUSTACHE_END' )
		if ( captures ) {
			this.skip( captures )
			this.state.leave( 'mustacheOpen' )
			// reset marker
			const marker = this.marker
			for ( const i in marker ) {
				if ( hasOwn.call( marker, i ) ) {
					marker[ i ] = 0
				}
			}
			return new Token( 'mustacheEnd' )
		}
	}
	private mustacheClose() {
		const captures = this.match( 'MUSTACHE_CLOSE' )
		if ( captures ) {
			const name = captures[ 1 ]
			this.skip( captures )
			return new Token( 'mustacheClose', name )
		}
	}
	// interpolation
	private interpolationOpen() {
		// skip when staying in tagOpen and mustacheOpen state
		if ( this.state.is( 'tagOpen' ) || this.state.is( 'mustacheOpen' ) ) {
			return
		}

		const captures = this.match( 'MUSTACHE_EXPRESSION_OPEN' )
		if ( captures ) {
			this.skip( captures )
			this.state.enter( 'mustacheOpen' )
			return new Token( 'interpolationOpen' )
		}
	}

	private expression() {
		if ( !this.state.is( 'mustacheOpen' ) ) {
			return
		}

		return (
			this.ident() ||
			this.number() ||
			this.string() ||
			this.symbol() ||
			this.brace()
		)
	}
	private ident() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_IDENT' )
		if ( captures ) {
			this.skip( captures )
			const ident = captures[ 1 ]
			return new Token( 'ident', ident )
		}
	}
	private number() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_NUMBER' )
		if ( captures ) {
			this.skip( captures )
			const number = captures[ 1 ]
			return new Token( 'number', parseFloat( number ) )
		}
	}
	private string() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_STRING' )
		if ( captures ) {
			this.skip( captures )
			const string = captures[ 2 ] || ''
			return new Token( 'string', string )
		}
	}
	private symbol() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_SYMBOL' )
		if ( captures ) {
			this.skip( captures )
			const symbol = captures[ 1 ]
			return new Token( 'symbol', symbol )
		}
	}
	// { | }
	private brace() {
		return this.braceOpen() || this.braceEnd()
	}
	private braceOpen() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_BRACE_OPEN' )
		if ( captures ) {
			this.skip( captures )
			const symbol = captures[ 1 ]
			this.marker.brace++
			return new Token( 'symbol', symbol )
		}
	}
	private braceEnd() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_BRACE_END' )
		if ( captures ) {
			const symbol = captures[ 1 ]
			this.marker.brace--

			if ( this.marker.brace >= 0 ) {
				this.skip( captures )
				return new Token( 'symbol', symbol )
			}

			// try to match mustacheEnd
			const token = this.mustacheEnd()
			if ( token && token.type === 'mustacheEnd' ) {
				return token
			}

			this.error( 'Unexpected }' )
		}
	}

	private text() {
		const captures = this.match( 'TEXT' )
		if ( captures ) {
			if ( this.state.is( 'tagOpen' ) || this.state.is( 'expressionOpen' ) ) {
				return this.error( 'text appears in unexpected state' )
			}

			this.skip( captures )
			const text = captures[ 0 ]
			return new Token( 'text', text )
		}
	}

	private whitespace() {
		const captures = this.match( 'WHITESPACE' )
		if ( captures ) {
			this.skip( captures )
			const whitespace = captures[ 0 ]
			return new Token( 'whitespace', whitespace )
		}
	}

	private eos() {
		if ( this.rest.length > 0 ) {
			return
		}

		return new Token( 'eos' )
	}
}
