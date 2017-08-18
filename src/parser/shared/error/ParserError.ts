export default class ParserError extends Error {
	constructor( message ) {
		super();
		this.name = 'ParserError';
		this.message = message;
	}
}
