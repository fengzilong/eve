export default function createRegistry() {
	const stash = {}

	return {
		find( name ) {
			if ( typeof stash[ name ] !== 'undefined' ) {
				return stash[ name ]
			}
		},
		findMany( names ) {
			return names.map( this.find )
		},
		register( name, stuff ) {
			stash[ name ] = stuff
		},
		unregister( name ) {
			delete stash[ name ]
		},
	}
}
