import Parser from './parser'

export default function ( source ) {
	return new Parser( source ).parse()
}
