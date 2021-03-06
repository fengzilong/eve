// @flow
import State from '../shared/state'
import Token from '../shared/token'
import LexerError from '../shared/error/LexerError'
import getCodeFrame from '../shared/getCodeFrame'
import patterns from './patterns'

const hasOwn = Object.hasOwnProperty

export default class TemplateLexer {
	// --- private ---

	source: string
	rest: string
	options: any
	stash: any[]
	pos: number
	marker: {
		brace: number
	}
	state: State

	// --- constructor ---

	constructor( source: string = '', options: any = {} ) {
		this.source = source
		this.rest = source
		this.options = options
		this.stash = []
		this.marker = {
			brace: 0,
		}
		this.state = new State()
		this.state.enter( options.initialState || 'data' )
		this.pos = 0

		if ( options.trim ) {
			const leadingSpaces = /^\s*/.exec( source )
			this.pos = leadingSpaces ? leadingSpaces[ 0 ].length : 0
			this.rest = source.trim()
		}

		if ( typeof options.startIndex === 'number' ) {
			this.pos = options.startIndex

			if ( typeof options.endIndex === 'number' ) {
				this.rest = source.substring( options.startIndex, options.endIndex )
			}
		}
	}

	// --- public ---

	lookahead( n ) {
		let fetch = n - this.stash.length
		while ( fetch-- > 0 ) {
			this.stash.push( this.advance() )
		}
		return this.stash[ --n ]
	}

	peek( n = 1 ) {
		return this.lookahead( n )
	}

	next() {
		const token = this.stashed() || this.advance()
		return token
	}

	// --- private ---

	stashed() {
		return this.stash.shift()
	}

	match( type ) {
		if ( !patterns[ type ] ) {
			return
		}
		return patterns[ type ].exec( this.rest )
	}

	skip( len ) {
		const chunk = len[ 0 ]
		len = chunk ? chunk.length : len
		this.rest = this.rest.substr( len )
		this.pos = this.pos + len
	}

	error( err ) {
		let message
		let pos

		if ( typeof err === 'string' ) {
			message = err
			pos = this.pos
		} else {
			message = err.message
			pos = typeof err.pos !== 'undefined' ? err.pos : this.pos
		}

		const codeframe = getCodeFrame( this.source, pos )
		throw new LexerError( {
			message,
			codeframe
		} )
	}

	advance() {
		const startPos = this.pos

		const token =
			this.eos() ||
			this.whitespace() ||
			this.tagOpen() ||
			this.tagEnd() ||
			this.tagClose() ||
			this.attributeKey() ||
			this.attributeValue() ||
			this.mustacheOpen() ||
			this.mustacheClose() ||
			this.interpolationOpen() ||
			// expression should be placed after `enter state mustacheOpen`
			this.expression() ||
			this.comment() ||
			this.text()

		const endPos = this.pos

		token.pos = startPos
		token.endPos = endPos
		token.frame = this.source.substring( startPos, endPos )

		return token
	}

	comment() {
		const captures = this.match( 'TAG_COMMENT' )
		if ( captures ) {
			this.skip( captures )
			const content = captures[ 1 ]
			return new Token( 'comment', { content } )
		}
	}
	tagOpen() {
		const captures = this.match( 'TAG_OPEN' )
		if ( captures ) {
			this.skip( captures )
			const name = captures[ 1 ]
			this.state.enter( 'tagOpen' )
			return new Token( 'tagOpen', { name } )
		}
	}
	attributeKey() {
		if ( !this.state.is( 'tagOpen' ) ) {
			return
		}

		const captures = this.match( 'ATTRIBUTE_KEY' )

		if ( captures ) {
			this.skip( captures )
			const value = captures[ 1 ]
			return new Token( 'attributeKey', { value } )
		}
	}
	attributeValue() {
		if ( !this.state.is( 'tagOpen' ) ) {
			return
		}

		const captures = this.match( 'ATTRIBUTE_VALUE' )

		if ( captures ) {
			const value = captures[ 3 ]
			const start = this.pos + captures[ 0 ].indexOf( value )
			const end = start + value.length
			this.skip( captures )
			return new Token( 'attributeValue', {
				value,
				start,
				end
			} )
		}
	}
	tagEnd() {
		if ( this.state.is( 'mustacheOpen' ) ) {
			return
		}

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
	tagClose() {
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
	mustacheOpen() {
		const captures = this.match( 'MUSTACHE_OPEN' )
		if ( captures ) {
			const name = captures[ 1 ]
			this.skip( captures )
			this.state.enter( 'mustacheOpen' )
			return new Token( 'mustacheOpen', name )
		}
	}
	mustacheEnd() {
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
	mustacheClose() {
		const captures = this.match( 'MUSTACHE_CLOSE' )
		if ( captures ) {
			const name = captures[ 1 ]
			this.skip( captures )
			return new Token( 'mustacheClose', name )
		}
	}
	// interpolation
	interpolationOpen() {
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

	expression() {
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
	ident() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_IDENT' )
		if ( captures ) {
			this.skip( captures )
			const ident = captures[ 1 ]
			return new Token( 'ident', ident )
		}
	}
	number() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_NUMBER' )
		if ( captures ) {
			this.skip( captures )
			const number = captures[ 1 ]
			return new Token( 'number', parseFloat( number ) )
		}
	}
	string() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_STRING' )
		if ( captures ) {
			this.skip( captures )
			const string = captures[ 2 ] || ''
			return new Token( 'string', string )
		}
	}
	symbol() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_SYMBOL' )
		if ( captures ) {
			this.skip( captures )
			const symbol = captures[ 1 ]
			return new Token( 'symbol', symbol )
		}
	}
	// { | }
	brace() {
		return this.braceOpen() || this.braceEnd()
	}
	braceOpen() {
		const captures = this.match( 'MUSTACHE_EXPRESSION_BRACE_OPEN' )
		if ( captures ) {
			this.skip( captures )
			const symbol = captures[ 1 ]
			this.marker.brace++
			return new Token( 'symbol', symbol )
		}
	}
	braceEnd() {
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

	text() {
		const captures = this.match( 'TEXT' )
		if ( captures ) {
			if ( this.state.is( 'tagOpen' ) || this.state.is( 'mustacheOpen' ) ) {
				return this.error( 'text appears in unexpected state' )
			}

			this.skip( captures )
			const text = captures[ 0 ]
			return new Token( 'text', text )
		}
	}

	whitespace() {
		if ( this.state.is( 'data' ) ) {
			return
		}

		const captures = this.match( 'WHITESPACE' )
		if ( captures ) {
			this.skip( captures )
			const whitespace = captures[ 0 ]
			return new Token( 'whitespace', whitespace )
		}
	}

	eos() {
		if ( this.rest.length > 0 ) {
			return
		}

		return new Token( 'eos' )
	}
}
