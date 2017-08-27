export default class LexerError extends Error {
	private codeframe: string

	constructor( { message = '', codeframe = '' } = {} ) {
		super()

		this.name = 'LexerError'
		this.message = message
		this.codeframe = codeframe

		if ( codeframe ) {
			console.error( codeframe )
		}
	}
}
