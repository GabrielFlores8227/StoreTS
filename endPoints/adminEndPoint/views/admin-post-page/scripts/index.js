import {
	token,
	buildAsideMenus,
	buildPropagandasTemplate,
	handleImageInput,
	buildPropagandas,
	handleCellRequest,
	buildIcon,
	buildLogo,
	buildTitle,
	buildColor,
	handleTableVisibility,
} from './modules.js';

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

(() => {
	window.document
		.querySelectorAll('div[file-input-container]')
		.forEach((div) => {
			handleImageInput(div);
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

	window.document.querySelectorAll('textarea').forEach((textarea) => {
		textarea.addEventListener('keydown', (e) => {
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
			textarea.style.height = 'auto';
			textarea.style.height = textarea.scrollHeight + 'px';
		});

		window.addEventListener('resize', () => {
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

	window.document.querySelectorAll('div[cell-container]').forEach((cell) => {
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
			let lastInnerText = div.innerText;

			div.addEventListener('focusout', async () => {
				const currentInnerText = div.innerText;

				if (currentInnerText === lastInnerText) {
					return;
				}

				handleInputValue(currentInnerText);

				lastInnerText = currentInnerText;
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

(() => {
	const build = [() => buildPropagandas()];

	const buildTemplate = [
		(specialSection) => buildPropagandasTemplate(specialSection),
	];

	window.document
		.querySelectorAll('div[special-section]')
		.forEach(async (div, index) => {
			await build[index]();

			handleTableVisibility();

			div
				.querySelector('button[add-item-to-table-button]')
				.addEventListener('click', () => {
					const templateUsable = buildTemplate[index](div);

					div.querySelector('template').parentElement.append(templateUsable);

					handleTableVisibility();
				});
		});
})();
