import parse from './parser/index'

export default function ( template ) {
	const ast = parse( template )
	return new Function ( 'e', `return {}` )
}
