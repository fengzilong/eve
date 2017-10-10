// @flow

import ParserError from '../shared/error/ParserError'
import getCodeFrame from '../shared/getCodeFrame'
import isSelfClosedTag from './utils/isSelfClosedTag'
import Lexer from './lexer'
import nodes from './nodeTypes'

// ---

export default class TemplateParser {
	// --- private ---

	source: string
	options: any
	lexer: Lexer
	dependencies: string[]
	scanned: any[]

	// --- constructor ---

	constructor( source = '', options = {} ) {
		this.source = source
		this.options = options
		this.scanned = []
	}

	// --- public ---

	parse( source ) {
		this.scanned = []
		this.globals = {}
		this.source = source || this.source

		// setup lexer
		this.lexer = new Lexer( this.source, this.options )

		return this.statements()
	}

	// --- private ---

	peek() {
		return this.lexer.peek()
	}

	peekBefore() {
		return this.scanned[ this.scanned.length - 1 ]
	}

	next() {
		const token = this.lexer.next()
		this.scanned.push( token )
		return token
	}

	skip( types ) {
		while ( ~types.indexOf( this.peek().type ) ) {
			this.next()
		}
	}

	skipWhitespace() {
		this.skip( [ 'whitespace' ] )
	}

	// quick match, if matched, return
	accept( type ) {
		const token = this.peek()
		if ( token.type === type ) {
			return this.next()
		}
	}

	// enhanced `this.next()`, with error reporting
	expect( type ) {
		const token = this.peek()
		if ( token.type === type ) {
			return this.next()
		}

		this.error( {
			message: `Expect ${ type }, but got ${ token.type }`,
			pos: token.pos
		} )
	}

	error( err: any ) {
		if ( typeof err === 'string' ) {
			throw new ParserError( {
				message: err
			} )
		} else if ( typeof err === 'object' ) {
			throw new ParserError( {
				message: err.message,
				codeframe: getCodeFrame( this.source, err.pos )
			} )
		}
	}

	// multiple statements, like `text + tag + text`, we should gather them in an array
	// use eos and tagClose as boundary, when we encounter extra tagClose token
	// it should be a endpoint for parent invoking
	statements() {
		const root = []
		while ( this.peek().type !== 'tagClose' && this.peek().type !== 'eos' ) {
			this.skipWhitespace()

			if ( this.peek().type === 'tagClose' || this.peek().type === 'eos' ) {
				break
			}

			const statement = this.statement()
			if ( statement ) {
				root.push( statement )
			}
		}
		return root
	}

	// distribute
	statement() {
		const token = this.peek()

		switch ( token.type ) {
			case 'whitespace':
				this.next()
				return
			case 'text':
				return this.text()
			case 'tagOpen':
				return this.tag()
			case 'mustacheOpen':
				return this.command()
			case 'interpolationOpen':
				return this.interpolation()
			case 'comment':
				this.next()
				return
			default:
				return this.error( {
					message: `Unexpected token ${token.type}`,
					pos: token.pos
				} )
		}
	}

	text() {
		let token
		let str = ''

		while ( ( token = this.accept( 'text' ) || this.accept( 'whitespace' ) ) ) { // tslint:disable-line
			str += token.value
		}

		return nodes.Text( str )
	}

	tag() {
		const tagToken = this.next()
		const tagName = tagToken.value.name

		const node = nodes.Tag( {
			name: tagName,
		} )

		while ( this.peek().type !== 'tagEnd' && this.peek().type !== 'eos' ) {
			const token = this.accept( 'attribute' )
			node.attributes[ token.value.name ] = token.value.value
		}

		const tagEndToken = this.expect( 'tagEnd' )

		// ends with `/>` or matches self-closed tags defined in w3c
		if ( tagEndToken.value.isSelfClosed ) {
			return node
		}

		node.children = this.statements() || []

		const closeToken = this.accept( 'tagClose' )
		if (
			!isSelfClosedTag( tagName ) &&
			( !closeToken || closeToken.value.name !== tagName )
		) {
			this.error( {
				message: `Unclosed tag <${ tagName }>`,
				pos: tagToken.pos + Math.ceil( tagName.length / 2 )
			} )
		}

		return node
	}

	// {#command expr}{/command}, such as if, list
	command() {
		const token = this.accept( 'mustacheOpen' )
		switch ( token.value ) {
			case 'if':
				return this.if()
			case 'each':
				return this.each()
			default:
				this.error( {
					message: `Unrecoginized Command {#${ token.value } ...}`,
					pos: token.pos + 2
				} )
		}
	}

	[ 'if' ]() {
		const ifToken = this.peekBefore()

		const node = nodes.IfStatement( {
			test: this.expression(), // match expression as `test`
			consequent: [], // set it later
			alternate: [], // set it later
		} )

		// for BlockStatement
		const { receive, changeReceiver } = ( function () {
			let receiver

			function receive( statement ) {
				if ( statement ) {
					receiver.push( statement )
				}
			}

			function changeReceiver( newReceiver ) {
				receiver = newReceiver
			}

			return { receive, changeReceiver }
		} )()

		// obviously consequent will be default receiver at first, until we meet `else`
		changeReceiver( node.consequent )

		// expect a mustacheEnd
		this.accept( 'mustacheEnd' )

		this.skipWhitespace()

		// find corresponding `{#else` and `{#elseif`
		while ( this.peek().type !== 'mustacheClose' && this.peek().type !== 'eos' ) {
			// don't accept any token here, do it later
			const token = this.peek()

			if ( token.type === 'mustacheOpen' ) {
				switch ( token.value ) {
					case 'elseif':
						// continue reading `IfStatement` into alternate
						this.next()
						node.alternate = this.if()
						break
					case 'else':
						// now receiver is changed to alternate
						this.next()
						this.accept( 'mustacheEnd' )
						changeReceiver( node.alternate )
						break
					default:
						receive( this.statement() )
						break
				}
			} else {
				receive( this.statement() )
			}
		}

		const mustacheCloseToken = this.accept( 'mustacheClose' )

		// maybe {/each}? it's not what we want
		if ( !mustacheCloseToken || mustacheCloseToken.value !== 'if' ) {
			this.error( {
				message: 'Unclosed {#if}',
				pos: ifToken.pos + 2
			} )
		}

		return node
	}
	each() {
		const eachToken = this.peekBefore()

		const node = nodes.EachStatement( {
			sequence: null,
			item: null,
			body: [],
		} )

		const expr = this.expression()
		const op = expr.tokens[ expr.tokens.length - 2 ]
		const item = expr.tokens[ expr.tokens.length - 1 ]

		if (
			!op ||
			op.type !== 'ident' ||
			op.value !== 'as'
		) {
			this.error( {
				message: `Expect 'as' in expression`,
				pos: eachToken.pos
			} )
		}

		if ( item && item.type === 'ident' ) {
			node.sequence = nodes.Expression( {
				tokens: expr.tokens.slice( 0, -2 )
			} )
			node.item = item.value
		} else {
			this.error( {
				message: `Expect right value in 'as' expression to be simple ident`,
				pos: eachToken.pos + 7
			} )
		}

		this.expect( 'mustacheEnd' )

		function receive( statement ) {
			if ( statement ) {
				node.body.push( statement )
			}
		}

		// add scope globals
		const prevGlobals = this.globals
		const currentGlobals = {}
		currentGlobals[ item.value ] = true
		currentGlobals[ item.value + '_index' ] = true
		currentGlobals[ item.value + '_key' ] = true
		this.globals = {
			...this.globals,
			...currentGlobals
		}

		while ( this.peek().type !== 'mustacheClose' && this.peek().type !== 'eos' ) {
			receive( this.statement() )
		}

		// reset scope globals
		this.globals = prevGlobals

		const token = this.accept( 'mustacheClose' )
		if ( !token || token.value !== 'each' ) {
			this.error( {
				message: 'Unclosed {#each}',
				pos: eachToken.pos + 2
			} )
		}

		return node
	}
	expression() {
		const tokens = []
		let token

		this.skipWhitespace()

		while (
			token =
				this.accept( 'ident' ) ||
				this.accept( 'string' ) ||
				this.accept( 'number' ) ||
				this.accept( 'symbol' )
		) {
			this.skipWhitespace()
			tokens.push( token )
		}

		// const { ast, compile } = parseExpression( this.source, tokens )

		return nodes.Expression( { tokens, globals: this.globals } )
	}

	interpolation() {
		this.accept( 'interpolationOpen' )

		const node = this.expression()

		this.accept( 'mustacheEnd' )

		return node
	}
}
