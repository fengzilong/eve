import Parser from './parser'

const parser = new Parser()

export default function ( source ) {
	return parser.parse( source )
}
