export default function ( { name = '', attributes = {}, children = [], isSelfClosed = false } ) {
	return {
		name,
		attributes,
		children,
		isSelfClosed,
	};
}
