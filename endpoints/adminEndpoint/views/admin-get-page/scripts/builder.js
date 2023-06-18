import {
	loadFileInputProperties,
	loadPseudoInputProperties,
	loadWhatsappProperties,
	handleCellRequest,
	handleTextInputRequest,
	handleTableVisibility,
	handleCursorIndex,
	handlePseudoInputCursorIndex,
	buildIcon,
	buildLogo,
	buildTitle,
	buildColor,
	buildPropagandas,
	buildCategories,
	buildProducts,
	buildPropagandasTemplate,
	buildCategoriesTemplate,
	buildProductsTemplate,
	buildProductsTemplateCallback,
} from './modules.js';

//
// Build Table Pre-Made
//

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
		textarea.style.height =
			textarea.scrollHeight <= 74
				? '53px'
				: textarea.offsetHeight + 14 * 2 + 'px';

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
		'/admin/api/header/icon': async () => await buildIcon(),
		'/admin/api/header/logo': async () => await buildLogo(),
		'/admin/api/header/title': async () => await buildTitle(),
		'/admin/api/header/color': async () => await buildColor(),
	};

	window.document.querySelectorAll('div[cell-container]').forEach((cell) => {
		const forItem = cell.getAttribute('for');
		const action = cell.getAttribute('action');
		const identifier = cell.getAttribute('identifier');

		cell.querySelectorAll('input[type="file"]').forEach((input) => {
			input.addEventListener('input', async (e) => {
				const form = new FormData();

				form.append('file', e.target.files[0]);
				form.append('id', identifier);

				const req = await handleCellRequest(cell, form);

				if (req && callBack[action]) {
					await callBack[action]();
				}
			});
		});

		cell.querySelectorAll('div[pseudo-input]').forEach((div) => {
			if (div.getAttribute('placeholder') === 'Whatsapp') {
				loadWhatsappProperties(div);
			}

			let lastInnerText = div.innerText;

			div.addEventListener('focusout', async () => {
				let currentInnerText = div.innerText;

				if (div.getAttribute('placeholder') === 'Whatsapp') {
					currentInnerText = currentInnerText.replace(/\D/g, '');
				}

				handleTextInputRequest(
					lastInnerText,
					cell,
					forItem,
					currentInnerText,
					identifier,
					callBack[action] ? async () => await callBack[action]() : undefined,
				);

				lastInnerText = currentInnerText;
			});
		});

		cell.querySelectorAll('textarea').forEach((input) => {
			input.addEventListener('change', async (e) => {
				handleTextInputRequest(
					false,
					cell,
					forItem,
					e.target.value,
					identifier,
				);
			});
		});

		cell.querySelectorAll('input[type="color"]').forEach((input) => {
			input.addEventListener('change', async (e) => {
				handleTextInputRequest(
					false,
					cell,
					forItem,
					e.target.value,
					identifier,
					async () => await callBack[action](),
				);
			});
		});
	});
})();

//
// Build Table Pos-Made
//

(() => {
	const build = [
		() => buildPropagandas(),
		() => buildCategories(),
		() => buildProducts(),
	];

	const buildTemplate = [
		(specialSection) => buildPropagandasTemplate(specialSection),
		(specialSection) => buildCategoriesTemplate(specialSection),
		(specialSection) => buildProductsTemplate(specialSection),
	];

	const buildTemplateCallback = [
		undefined,
		undefined,
		() => buildProductsTemplateCallback(),
	];

	window.document
		.querySelectorAll('div[special-section]')
		.forEach((div, index) => {
			build[index]();

			handleTableVisibility();

			div
				.querySelector('button[add-item-to-table-button]')
				.addEventListener('click', async () => {
					const templateUsable = buildTemplate[index](div);

					div
						.querySelector('tbody > template')
						.parentElement.append(templateUsable);

					handleTableVisibility();

					if (buildTemplateCallback[index]) {
						await buildProductsTemplateCallback();
					}
				});
		});
})();
