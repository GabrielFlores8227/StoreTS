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

					div.querySelector('template').parentElement.append(templateUsable);

					handleTableVisibility();

					if (buildTemplateCallback[index]) {
						await buildProductsTemplateCallback();
					}
				});
		});
})();
