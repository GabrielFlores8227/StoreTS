import {
	handleTableVisibility,
	buildPropagandas,
	buildCategories,
	buildPropagandasTemplate,
	buildCategoriesTemplate,
} from './modules.js';

(() => {
	const build = [() => buildPropagandas(), () => buildCategories()];

	const buildTemplate = [
		(specialSection) => buildPropagandasTemplate(specialSection),
		(specialSection) => buildCategoriesTemplate(specialSection),
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
