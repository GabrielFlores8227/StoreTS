import {
	token,
	loadFileInputProperties,
	handleCellRequest,
	buildIcon,
	buildLogo,
	buildTitle,
	buildColor,
	loadPseudoInputProperties,
} from './modules.js';

(() => {
	window.document
		.querySelectorAll('div[file-input-container]')
		.forEach((div) => {
			loadFileInputProperties(div);
		});
})();

(() => {
	window.document.querySelectorAll('div[pseudo-input]').forEach((div) => {
		loadPseudoInputProperties(div);
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
			textarea.style.height = '53px';

			if (textarea.scrollHeight - textarea.offsetHeight === 0) {
				return;
			}

			textarea.style.height = 'auto';
			textarea.style.height = textarea.scrollHeight + 'px';
		});

		window.addEventListener('resize', () => {
			textarea.style.height = '53px';

			if (textarea.scrollHeight - textarea.offsetHeight === 0) {
				return;
			}

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
