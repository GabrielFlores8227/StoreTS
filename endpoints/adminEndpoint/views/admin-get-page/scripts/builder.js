import {
	loadFileInputProperties,
	loadPseudoInputProperties,
	loadWhatsappProperties,
	handleCellRequest,
	handleTextInputRequest,
	handleTableVisibility,
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

/**
 * Immediately invoked function expression (IIFE) that applies the 'loadFileInputProperties' function
 * to all 'div' elements with the 'file-input-container' attribute.
 */
(() => {
	window.document
		.querySelectorAll('div[file-input-container]')
		.forEach((div) => {
			loadFileInputProperties(div);
		});
})();

/**
 * Immediately invoked function expression (IIFE) that applies the 'loadPseudoInputProperties' function
 * to all 'div' elements with the 'pseudo-input' attribute, and adds a 'keydown' event listener to all
 * 'textarea' elements to handle the 'Enter' key press.
 */
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

/**
 * Immediately invoked function expression (IIFE) that adjusts the height of 'textarea' elements
 * based on their content and handles resizing when the window is resized.
 */
(() => {
	window.document.querySelectorAll('textarea').forEach((textarea) => {
		textarea.style.height =
			textarea.scrollHeight <= 74
				? '53px'
				: `${textarea.offsetHeight + 14 * 2}px`;

		if (textarea.scrollHeight === 74) {
			textarea.style.height = 'auto';
		}

		textarea.addEventListener('input', () => {
			textarea.style.height = '53px';

			if (textarea.scrollHeight - textarea.offsetHeight === 0) {
				return;
			}

			textarea.style.height = 'auto';
			textarea.style.height = `${textarea.scrollHeight}px`;
		});

		window.addEventListener('resize', () => {
			textarea.style.height = '53px';

			if (textarea.scrollHeight - textarea.offsetHeight === 0) {
				return;
			}

			textarea.style.height = 'auto';
			textarea.style.height = `${textarea.scrollHeight}px`;
		});
	});
})();

/**
 * Immediately invoked function expression (IIFE) that handles various interactions within 'div[cell-container]'
 * elements, such as file input changes, pseudo input focusout, textarea changes, and input color changes.
 * It utilizes callback functions based on the specified 'action' attribute.
 */
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

/**
 * Immediately invoked function expression (IIFE) that initializes and handles the dynamic building of elements and templates.
 * It iterates over special sections in the document, builds specific elements, sets up event listeners, and handles table visibility.
 */
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
