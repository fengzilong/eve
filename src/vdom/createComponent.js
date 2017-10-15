export default createComponent

// ---

function createComponent( node, vnode = {}, ctor ) {
	const attrs = vnode.attrs || {}
	const events = vnode.events || {}

	const instance = new ctor( {
		data: attrs
	} )

	for ( const eventName in events ) {
		console.log( 'bind event', eventName );
		instance.$on( eventName, e => {
			let fns = events[ eventName ]

			if ( typeof fns === 'function' ) {
				return fns.call( instance, e )
			}

			for ( let i = 0, len = fns.length; i < len; i++ ) {
				const fn = fns[ i ]
				fn.call( instance, e )
			}
		} )
	}

	instance.$mount( node )
}
