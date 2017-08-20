export default class LexerError extends Error {
	constructor( message ) {
		super()
		this.name = 'LexerError'
		this.message = message
	}
}
