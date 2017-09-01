import Compiler from './compiler'

const compiler = new Compiler()

export default function ( source ) {
	const renderFnString = compiler.compile( source )
	console.log( renderFnString );
	return {
		dependencies: [],
		render: new Function ( 'h', 'return ' + renderFnString )
	}
}
