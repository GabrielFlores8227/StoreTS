import { buildAsideMenus } from './modules.js';

/**
 * Immediately invoked function expression (IIFE) that adds a click event listener to the button within the 'div[warning]' element.
 * When the button is clicked, the page is reloaded.
 */
(() => {
	window.document
		.querySelector('div[warning] button')
		.addEventListener('click', () => {
			location.reload(true);
		});
})();

/**
 * Function that builds aside menus based on the provided configuration array.
 * Each configuration object in the array specifies a selector, element, and action to perform on the element.
 * The selector is used to identify the button that triggers the action.
 * The element is the target aside menu element.
 * The action can be 'add' or 'remove' to add or remove a class from the element, respectively.
 * @param {Array} menus - The configuration array for building aside menus.
 */
buildAsideMenus([
	{
		selector: 'open-settings-aside-menu-button',
		element: document.querySelector('aside[settings-aside-menu]'),
		action: 'add',
	},
	{
		selector: 'close-settings-aside-menu-button',
		element: document.querySelector('aside[settings-aside-menu]'),
		action: 'remove',
	},
]);

/**
 * Immediately invoked function expression (IIFE) that enables sliding functionality for slider containers.
 * It allows users to scroll horizontally within the slider container by dragging or swiping.
 * The functionality is triggered by mouse or touch events.
 */
(() => {
	const sliderContainer = document.querySelectorAll('[table-container]');

	for (let c = 0; c < sliderContainer.length; c++) {
		let isDown = false;
		let startX;
		let scrollLeft;
		let position;

		sliderContainer[c].addEventListener('touchmove', () => {
			if (
				e.target.getAttribute('contenteditable') ||
				e.target.tagName === 'TEXTAREA'
			) {
				return;
			}

			isDown = true;
		});
		sliderContainer[c].addEventListener('touchend', () => {
			isDown = false;
		});
		sliderContainer[c].addEventListener('mousedown', (e) => {
			if (
				e.target.getAttribute('contenteditable') ||
				e.target.tagName === 'TEXTAREA'
			) {
				return;
			}

			isDown = true;
			sliderContainer[c].classList.add('active');
			startX = e.pageX - sliderContainer[c].offsetLeft;
			scrollLeft = sliderContainer[c].scrollLeft;
		});
		sliderContainer[c].addEventListener('mouseleave', () => {
			isDown = false;
			sliderContainer[c].classList.remove('active');
		});
		sliderContainer[c].addEventListener('mouseup', () => {
			isDown = false;
			sliderContainer[c].classList.remove('active');
		});
		sliderContainer[c].addEventListener('mousemove', (e) => {
			if (!isDown) return;
			e.preventDefault();
			const x = e.pageX - sliderContainer[c].offsetLeft;
			const walk = x - startX;
			sliderContainer[c].scrollLeft = scrollLeft - walk;
			position = sliderContainer[c].scrollLeft;
		});
	}
})();
