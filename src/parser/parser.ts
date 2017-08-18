import ParserError from './shared/error/ParserError'
import getCodeFrame from './shared/getCodeFrame'
import { isSelfClosedTag } from './shared/is'
import Lexer from './lexer'
import nodes from './nodes/index'

export default class TemplateParser {
	private source: string
	private options: any
	private lexer: Lexer

	constructor( source = '', options = {} ) {
		this.source = source
		this.options = options
	}

	public parse() {
		// setup lexer
		this.lexer = new Lexer( this.source, this.options )

		// generate program node as ast root
		const program = nodes.Program( {
			body: this.statements(),
		} )

		return program
	}

	private peek() {
		return this.lexer.peek()
	}

	private next() {
		// console.log( this.lexer.peek().type, this.lexer.peek().frame )
		return this.lexer.next()
	}

	private skip( types ) {
		while ( ~types.indexOf( this.peek().type ) ) {
			this.next()
		}
	}

	private skipWhitespace() {
		this.skip( [ 'whitespace' ] )
	}

	// quick match, if matched, return
	private accept( type ) {
		const token = this.peek()
		if ( token.type === type ) {
			return this.next()
		}
	}

	// enhanced `this.next()`, with error reporting
	private expect( type ) {
		const token = this.peek()
		if ( token.type === type ) {
			return this.next()
		}

		const codeframe = getCodeFrame( this.source, token.pos )

		this.error( `Expect ${ type }, but got ${ token.type }, codeframe: ${ codeframe }` )
	}

	private error( message ) {
		throw new ParserError( message )
	}

	// multiple statements, like `text + tag + text`, we should gather them in an array
	// use eos and tagClose as boundary, when we encounter extra tagClose token
	// it should be a endpoint for parent invoking
	private statements() {
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
	private statement() {
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
				return this.directive()
			case 'interpolationOpen':
				return this.interpolation()
			case 'comment':
				this.next()
				return
			default:
				return this.error(
					`[statement] Unexpected token ${token.type}, code frame: ${token.frame}`
				)
		}
	}

	private text() {
		let token
		let str = ''

		while ( ( token = this.accept( 'text' ) || this.accept( 'whitespace' ) ) ) { // tslint:disable-line
			str += token.value
		}

		return nodes.Text( str )
	}

	private tag() {
		const node = nodes.Tag( {
			name: this.next().value.name,
		} )

		while ( this.peek().type !== 'tagEnd' && this.peek().type !== 'eos' ) {
			const token = this.accept( 'attribute' )
			node.attributes[ token.value.name ] = token.value.value
		}

		const tagEndToken = this.expect( 'tagEnd' )

		// ends with `/>` or matches self-closed tags defined in w3c
		if ( tagEndToken.value.isSelfClosed || isSelfClosedTag( node.name ) ) {
			return node
		}

		node.children = this.statements() || []

		const closeToken = this.expect( 'tagClose' )
		if ( closeToken.value.name !== node.name ) {
			this.error( `Unmatched close tag for ${ node.name }` )
		}

		return node
	}

	// {#directive expr}{/directive}, such as if, list
	private directive() {
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
			this.error( `Unexpected directive ${ token.value }` )
		}
	}

	private include() {
		const node = nodes.Include( {
			body: this.expression(),
		} )

		this.skipWhitespace()

		this.expect( 'mustacheEnd' )

		return node
	}

	private ['if']() {
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

		const mustacheCloseToken = this.expect( 'mustacheClose' )

		// maybe {/each}? it's not what we want
		if ( mustacheCloseToken.value !== 'if' ) {
			this.error( 'Expect {/if} for {#if}' )
		}

		return node
	}
	private each() {
		const node = nodes.Each( {
			sequence: null,
			item: null,
			body: [],
		} )

		// TODO: read sequence and item
		this.expression()

		this.expect( 'mustacheEnd' )

		function receive( statement ) {
			if ( statement ) {
				node.body.push( statement )
			}
		}

		while ( this.peek().type !== 'mustacheClose' ) {
			receive( this.statement() )
		}

		const token = this.expect( 'mustacheClose' )
		if ( token.value !== 'each' ) {
			this.error( 'unmatched each' )
		}

		return node
	}
	private expression() {
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
			value: 'expression',
		} )
	}

	private interpolation() {
		this.accept( 'interpolationOpen' )

		const node = this.expression()

		this.accept( 'mustacheEnd' )

		return node
	}
}
