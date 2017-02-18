/* eslint-disable */

function extend( definition ) {
	const parent = this;
	const parentProto = this.prototype;

	function Proxy() {};
	Proxy.prototype = parentProto;

	function Child() {
		parent.apply( this, arguments );
	};
	Child.prototype = new Proxy();

	// add extend and implement
	Child.extend = extend;
	Child.implement = implement;

	return Child;
}

function implement( methods ) {

}

export default function extendify( target = () => {} ) {
	target.extend = extend;
	target.implement = implement;

	return target;
}
