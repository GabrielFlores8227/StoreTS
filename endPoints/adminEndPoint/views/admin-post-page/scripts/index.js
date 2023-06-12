import { getCookie, clearCookie, buildAsideMenus } from './modules.js';

(() => {
	const token = getCookie('token');
	clearCookie('token');
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
