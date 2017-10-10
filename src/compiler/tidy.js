export default function tidy( ast ) {
	return ast.filter( v => {
		if ( v.type === 'Text' && /^\s+$/.test( v.value ) ) {
			return false
		}

		return true
	} )
}
