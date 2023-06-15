import { token, buildAsideMenus } from './modules.js';

console.log(token);

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
