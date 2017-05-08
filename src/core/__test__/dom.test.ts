import { createElement, removeElement, addEvent, removeEvent } from '../dom';

test( 'createElement works', () => {
	const el = createElement( 'path' );
	expect( el ).toBeDefined();
} );

test( 'removeElement works', () => {
	const el = createElement( 'div' );
	el.id = 'foo';
	document.body.appendChild( el );

	expect( document.getElementById( 'foo' ) ).toBeTruthy();
	removeElement( el );
	expect( document.getElementById( 'foo' ) ).toBeFalsy();
} );

test( 'addEvent works', () => {
	const el = createElement( 'div' );

	const fn = jest.fn();
	addEvent( el, 'click', fn );
	el.click();

	expect( fn ).toHaveBeenCalledTimes( 1 );
} );

test( 'removeEvent works', () => {
	const el = createElement( 'div' );

	const fn = jest.fn();
	addEvent( el, 'click', fn );
	removeEvent( el, 'click', fn );
	el.click();

	expect( fn ).toHaveBeenCalledTimes( 0 );
} );
