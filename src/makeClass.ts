/* eslint-disable */

export default makeClass;

function makeClass(
	protoProps = {},
	staticProps = {},
	target: any = () => {}
) {
	Object.assign( target, staticProps );
	Object.assign( target.prototype, protoProps );
	target.extend = extend;
	target.implement = implement;

	return target;
}

function extend( definition = {} ) {
	const parent = this;
	const parentProto = this.prototype;

	const Child: any = function () {
		parent.apply( this, arguments );
	};
	Child.prototype = createPrototype( parentProto );

	// add extend and implement
	Child.extend = extend;
	Child.implement = implement;

	// merge to prototype
	Child.implement( definition );

	return Child;
}

function implement( definition ) {
	const proto = this.constructor.prototype;
	Object.assign( proto, definition );
}

function createPrototype( protoProps ) {
	function Proxy() {};
	Proxy.prototype = protoProps;
	return new Proxy();
}
