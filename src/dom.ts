import { isSVGTag } from './is';
import { SVG_NAMESPACE } from './constants';

export function createElement( tagName: string ) {
	if ( isSVGTag( tagName ) ) {
		return document.createElementNS( SVG_NAMESPACE, tagName );
	}

	return document.createElement( tagName );
}

export function removeElement( element ): void {
	if ( element && element.parentNode ) {
		element.parentNode.removeChild( element );
	}
}

export function addEvent( element, eventName: string, listener: Function ): void {
	if ( element.addEventListener ) {
		element.addEventListener( eventName, listener, false );
	} else {
		element.attachEvent( `on${ eventName }`, listener );
	}
}

export function removeEvent( element, eventName: string, listener: Function ): void {
	if ( element.addEventListener ) {
		element.removeEventListener( eventName, listener, false );
	} else {
		element.detachEvent( `on${ eventName }`, listener );
	}
}
