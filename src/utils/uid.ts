export default uid

// ----------------

const prefix = '(>ε<)'
let id = 0

function uid() {
	return `${ prefix }_${ id++ }`
}
