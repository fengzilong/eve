export default class ParserError extends Error {
	private codeframe: string

	constructor( { message = '', codeframe = '' } = {} ) {
		super()

		this.name = 'ParserError'
		this.message = message
		this.codeframe = codeframe

		if ( codeframe ) {
			console.error( codeframe )
		}
	}
}
