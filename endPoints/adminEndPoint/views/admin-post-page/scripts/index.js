import {
	token,
	buildAsideMenus,
	handleCellRequest,
	buildIcon,
	buildLogo,
	buildTitle,
	buildColor,
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
	window.document.querySelectorAll('div[pseudo-input]').forEach((div) => {
		let lastInput = '';

		div.addEventListener('input', () => {
			const value = div.innerText;
			const maxLength = Number(div.getAttribute('maxlength'));

			if (value.length > maxLength) {
				div.innerText = lastInput;

				return;
			}

			lastInput = value;
		});

		div.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.target.blur();
				return e.preventDefault();
			}
		});
	});
})();

(() => {
	window.document.querySelectorAll('textarea').forEach((textarea) => {
		textarea.style.height = textarea.scrollHeight + 'px';

		textarea.addEventListener('input', () => {
			console.log(textarea.offsetHeight);
			textarea.style.height = 'auto';
			textarea.style.height = textarea.scrollHeight + 'px';
		});
	});
})();

(() => {
	const callBack = {
		icon: async () => await buildIcon(),
		logo: async () => await buildLogo(),
		title: async () => await buildTitle(),
		color: async () => await buildColor(),
	};

	window.document.querySelectorAll('div[cell]').forEach((cell) => {
		const forItem = cell.getAttribute('for');
		const identifier = cell.getAttribute('identifier');

		cell.querySelectorAll('input[type="file"]').forEach((input) => {
			input.addEventListener('input', async (e) => {
				const form = new FormData();

				form.append('file', e.target.files[0]);
				form.append('id', identifier);

				const req = await handleCellRequest(token, cell, form);

				if (req && callBack[forItem]) {
					await callBack[forItem]();
				}
			});
		});

		cell.querySelectorAll('div[pseudo-input]').forEach((div) => {
			div.addEventListener('focusout', async () => {
				handleInputValue(div.innerText);
			});
		});

		cell.querySelectorAll('textarea').forEach((input) => {
			input.addEventListener('change', async (e) => {
				handleInputValue(e.target.value);
			});
		});

		cell.querySelectorAll('input[type="color"]').forEach((input) => {
			input.addEventListener('change', async (e) => {
				handleInputValue(e.target.value);
			});
		});

		async function handleInputValue(value) {
			let form = {};

			form[forItem] = value;
			form['id'] = identifier;

			form = JSON.stringify(form);

			const req = await handleCellRequest(
				token,
				cell,
				form,
				'application/json',
			);

			if (req && callBack[forItem]) {
				await callBack[forItem]();
			}
		}
	});
})();
