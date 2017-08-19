export default class ParserError extends Error {
	private codeframe: string

	constructor( message, { codeframe = '' } = {} ) {
		super()
		this.name = 'ParserError'
		this.message = message

		if ( codeframe ) {
			this.codeframe = codeframe
			console.error( codeframe )
		}
	}
}
