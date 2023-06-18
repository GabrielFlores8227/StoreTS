import {
	handleTableVisibility,
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

	window.document
		.querySelectorAll('div[header-table-section] div[cell-container]')
		.forEach((cell) => {
			const forItem = cell.getAttribute('for');
			const identifier = cell.getAttribute('identifier');

			cell.querySelectorAll('input[type="file"]').forEach((input) => {
				input.addEventListener('input', async (e) => {
					const form = new FormData();

					form.append('file', e.target.files[0]);
					form.append('id', identifier);

					const req = await handleCellRequest(cell, form);

					if (req && callBack[forItem]) {
						await callBack[forItem]();
					}
				});
			});

			cell.querySelectorAll('div[pseudo-input]').forEach((div) => {
				let lastInnerText = div.innerText;

				div.addEventListener('focusout', async () => {
					const currentInnerText = div.innerText;

					handleTextInputRequest(
						lastInnerText,
						cell,
						forItem,
						currentInnerText,
						identifier,
						async () => await callBack[forItem](),
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
						async () => await callBack[forItem](),
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
