export default function ( { name = '', attributes = {}, children = [], isSelfClosed = false } ) {
	return {
		type: 'Tag',
		name,
		attributes,
		children,
		isSelfClosed,
	}
}
