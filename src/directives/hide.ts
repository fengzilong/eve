export default {
	// 使用具体的钩子，便于控制，由用户自己使用$watch，加了vdom后更新的时机不好把握
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
