export const hide = {
	updated( el, binding ) {
		if ( binding.value !== binding.oldValue ) {
			if ( binding.value ) {
				el.style.display = 'none'
			} else {
				el.style.display = 'block' // TODO: maybe not block
			}
		}
	}
}
