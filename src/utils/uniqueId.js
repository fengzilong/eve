export default uniqueId

// ----------------

const prefix = '(>ε<)'
let id = 0

function uniqueId() {
	return `${ prefix }_${ id++ }`
}
