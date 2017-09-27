export { h, g, l }

// ---

function h( type, attrs = {}, children = [], extra = {} ) {
	return { type, attrs, children, ...extra }
}

function g( name ) {
	// bind before passing to render function
	return this.data[ name ]
}

function l( sequence = [], callback ) {
	const tmp = []

	let i = 0
	for ( let v of sequence ) {
		console.log( 'looping', v, i );
		for ( let v2 of callback( v, i ) ) {
			tmp.push( v2 )
		}
		i++
	}

	return tmp
}
