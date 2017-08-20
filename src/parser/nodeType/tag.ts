export default function ( { name = '', attributes = {}, children = [], isSelfClosed = false } ) {
	return {
		type: 'tag',
		name,
		attributes,
		children,
		isSelfClosed,
	}
}
