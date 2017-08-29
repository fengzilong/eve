// @flow

import ParserError from './error/ParserError'
import getCodeFrame from './utils/getCodeFrame'
import isSelfClosedTag from './utils/isSelfClosedTag'
import Lexer from './lexer'
import nodes from './nodeType/index'
import ExpressionParser from './expression'

// ---

const parser = new ExpressionParser()
function parseExpression( source, tokens ) {
	return parser.parse( source, tokens )
}

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
		this.source = source || this.source

		// setup lexer
		this.lexer = new Lexer( this.source, this.options )

		// generate program node as ast root
		const program = nodes.Program( {
			body: this.statements(),
		} )

		return program
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
		if ( tagEndToken.value.isSelfClosed || isSelfClosedTag( tagName ) ) {
			return node
		}

		node.children = this.statements() || []

		const closeToken = this.accept( 'tagClose' )
		if ( !closeToken || closeToken.value.name !== tagName ) {
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
			case 'inc':
			case 'include':
				return this.include()
			default:
				this.error( {
					message: `Unrecoginized Command {#${ token.value } ...}`,
					pos: token.pos + 2
				} )
		}
	}

	include() {
		const node = nodes.Include( {
			body: this.expression(),
		} )

		this.skipWhitespace()

		this.expect( 'mustacheEnd' )

		return node
	}

	['if']() {
		const ifToken = this.peekBefore()

		const node = nodes.If( {
			test: this.expression(), // match expression as `test`
			consequent: null, // set it later
			alternate: null, // set it later
		} )

		// for BlockStatement
		const { receive, changeReceiver } = ( function () {
			let receiver

			function receive( statement ) {
				if ( statement ) {
					receiver.body.push( statement )
				}
			}

			function changeReceiver( newReceiver ) {
				receiver = newReceiver
			}

			return { receive, changeReceiver }
		} )()

		// obviously consequent will be default receiver at first, until we meet `else`
		changeReceiver( ( node.consequent = nodes.Block() ) )

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
						changeReceiver( ( node.alternate = nodes.Block() ) )
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

		const node = nodes.Each( {
			sequence: null,
			item: null,
			body: [],
		} )

		// TODO: read sequence and item
		const expr = this.expression()

		if ( expr.body.op !== 'as' ) {
			this.error( {
				message: `Expect 'as' expression`
			} )
		}

		if ( expr.body.right.type === 'ident' ) {
			node.sequence = nodes.Expression( {
				body: expr.body.left
			} )
			node.item = expr.body.right.value
		} else {
			this.error( {
				message: `Expect right value in 'as' expression to be simple ident`
			} )
		}

		this.expect( 'mustacheEnd' )

		function receive( statement ) {
			if ( statement ) {
				node.body.push( statement )
			}
		}

		while ( this.peek().type !== 'mustacheClose' && this.peek().type !== 'eos' ) {
			receive( this.statement() )
		}

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

		/* tslint:disable */
		while ( ( token =
			this.accept( 'ident' ) ||
			this.accept( 'string' ) ||
			this.accept( 'number' ) ||
			this.accept( 'symbol' )
		) ) { /* tslint:enable */
			this.skipWhitespace()
			tokens.push( token )
		}

		return nodes.Expression( {
			body: parseExpression( this.source, tokens ),
		} )
	}

	interpolation() {
		this.accept( 'interpolationOpen' )

		const node = this.expression()

		this.accept( 'mustacheEnd' )

		return node
	}

	// --- private end ---
}
