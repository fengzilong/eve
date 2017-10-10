import Compiler from './compiler'

const compiler = new Compiler()

export default function ( source ) {
	const renderFnString = compiler.compile( source )
	console.log( renderFnString );
	return {
		dependencies: [],
		render: new Function ( '_h', '_g', '_l', '_o', 'return _o( ' + renderFnString + ' )' )
	}
}
