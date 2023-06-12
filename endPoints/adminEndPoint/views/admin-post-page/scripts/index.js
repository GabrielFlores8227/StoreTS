import {
	token,
	buildAsideMenus,
	handleCellRequest,
	handleIconCallBack,
	handleLogoCallBack,
} from './modules.js';

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
	window.document
		.querySelectorAll('div[file-input-container]')
		.forEach((div) => {
			const link = div.querySelector('a');
			const fileInput = div.querySelector('input');

			fileInput.addEventListener('input', (e) => {
				const file = e.target.files[0];
				const fileURL = URL.createObjectURL(file);

				link.href = fileURL;
				link.innerText = e.target.files[0].name;
			});
		});
})();

(() => {
	const callBack = {
		icon: async () => await handleIconCallBack(),
		logo: async () => await handleLogoCallBack(),
	};

	window.document.querySelectorAll('div[cell]').forEach((cell) => {
		const forItem = cell.getAttribute('for');

		cell.querySelectorAll('input[type="file"]').forEach((input) => {
			input.addEventListener('input', async (e) => {
				const form = new FormData();

				form.append('file', e.target.files[0]);
				form.append('id', cell.getAttribute('identifier'));

				await handleCellRequest(token, cell, form);

				if (forItem) {
					await callBack[forItem]();
				}
			});
		});
	});
})();
