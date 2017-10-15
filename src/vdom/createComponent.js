export default createComponent

// ---

function createComponent( node, attrs = {}, ctor ) {
	const instance = new ctor( {
		data: attrs
	} )

	instance.$mount( node )
}
