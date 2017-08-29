export default function callHook( context, name ) {
	const m = context[ name ]
	if ( typeof m === 'function' ) {
		return m.call( context )
	} else {
		console.warn( `hook ${ name } doesn't exist` )
	}
}
