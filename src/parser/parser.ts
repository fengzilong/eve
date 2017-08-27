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
	private source: string
	private options: any
	private lexer: Lexer
	private dependencies: string[]
	private scanned: any[]

	constructor( source = '', options = {} ) {
		this.source = source
		this.options = options
		this.scanned = []
	}

	public parse( source ) {
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

	private peek() {
		return this.lexer.peek()
	}

	private peekBefore() {
		return this.scanned[ this.scanned.length - 1 ]
	}

	private next() {
		const token = this.lexer.next()
		this.scanned.push( token )
		return token
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

		this.error( {
			message: `Expect ${ type }, but got ${ token.type }`,
			pos: token.pos
		} )
	}

	private error( err: any ) {
		if ( typeof err === 'string' ) {
			throw new ParserError( err )
		} else if ( typeof err === 'object' ) {
			throw new ParserError( err.message, {
				codeframe: getCodeFrame( this.source, err.pos )
			} )
		}
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

	private text() {
		let token
		let str = ''

		while ( ( token = this.accept( 'text' ) || this.accept( 'whitespace' ) ) ) { // tslint:disable-line
			str += token.value
		}

		return nodes.Text( str )
	}

	private tag() {
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
	private command() {
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
					message: `Command {#${ token.value } ...} cannot be recoginized`,
					pos: token.pos + 2
				} )
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
	private each() {
		const eachToken = this.peekBefore()

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
			body: parseExpression( this.source, tokens ),
		} )
	}

	private interpolation() {
		this.accept( 'interpolationOpen' )

		const node = this.expression()

		this.accept( 'mustacheEnd' )

		return node
	}
}
