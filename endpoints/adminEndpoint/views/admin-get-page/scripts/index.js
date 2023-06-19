import { buildAsideMenus } from './modules.js';

(() => {
	window.document
		.querySelector('div[warning] button')
		.addEventListener('click', () => {
			location.reload(true);
		});
})();

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
