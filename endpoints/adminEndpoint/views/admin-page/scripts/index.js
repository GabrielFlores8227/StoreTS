import {
	getWebsite,
	getProducts,
	loadFileInputProperties,
	loadPseudoInputProperties,
	loadWhatsappProperties,
	handleCellRequest,
	handleTextInputRequest,
	handleTableVisibility,
	buildAsideMenus,
	buildWebsiteAccesses,
	buildProductTotalClicks,
	buildMostClickedCategory,
	buildWebsiteAccessesYearChart,
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
	buildWebsiteAccessesMonthChart,
} from './modules.js';

/**
 * Immediately invoked function expression (IIFE) that adds a click event listener to the button within the 'div[warning]' element.
 * When the button is clicked, the page is reloaded.
 */
(() => {
	window.document
		.querySelector('div[multiple-windows-warning] button')
		.addEventListener('click', () => {
			location.reload(true);
		});
})();

/**
 * Function that builds aside menus based on the provided configuration array.
 * Each configuration object in the array specifies a selector, element, and action to perform on the element.
 * The selector is used to identify the button that triggers the action.
 * The element is the target aside menu element.
 * The action can be 'add' or 'remove' to add or remove a class from the element, respectively.
 * @param {Array} menus - The configuration array for building aside menus.
 */
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

(async () => {
	const website = await getWebsite();

	const _dates = website.history.map((dateString) => {
		const date = moment(dateString).toDate();
		const month = moment(date).locale('pt-br').format('MMMM');
		const year = moment(date).format('YYYY');
		return { date, month, year };
	});

	const dates = {};

	_dates.forEach((date) => {
		const month = date.month;
		const year = date.year;

		if (!dates[year]) {
			dates[year] = {};
		}

		if (!dates[year][month]) {
			dates[year][month] = [];
		}

		dates[year][month].push(date);
	});

	const currentYear = new Date().getFullYear();

	if (Object.keys(dates).length === 0) {
		window.document
			.querySelector('div[access-history-chart-container]')
			.remove();

		return;
	}

	buildWebsiteAccesses(dates[currentYear]);

	const years = Object.keys(dates);

	if (years.length === 1) {
		const months = Object.keys(dates[years]);

		if (months.length === 1) {
			buildWebsiteAccessesMonthChart(dates);

			return;
		}
	}

	buildWebsiteAccessesYearChart(dates);
})();

(async () => {
	const currentYear = new Date().getFullYear();

	const products = await getProducts();

	Object.keys(products).forEach((category) => {
		products[category].forEach((product) => {
			const newHistory = [];

			product.history.forEach((date) => {
				if (date.startsWith(currentYear)) {
					newHistory.push(date);
				}
			});

			product.history = newHistory;
		});
	});

	buildProductTotalClicks(products);
	buildMostClickedCategory(products);
})();

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

/**
 * Immediately invoked function expression (IIFE) that enables sliding functionality for slider containers.
 * It allows users to scroll horizontally within the slider container by dragging or swiping.
 * The functionality is triggered by mouse or touch events.
 */
(() => {
	const sliderContainer = document.querySelectorAll('[table-container]');

	for (let c = 0; c < sliderContainer.length; c++) {
		let isDown = false;
		let startX;
		let scrollLeft;
		let position;

		sliderContainer[c].addEventListener('touchmove', () => {
			if (
				e.target.getAttribute('contenteditable') ||
				e.target.tagName === 'TEXTAREA'
			) {
				return;
			}

			isDown = true;
		});
		sliderContainer[c].addEventListener('touchend', () => {
			isDown = false;
		});
		sliderContainer[c].addEventListener('mousedown', (e) => {
			if (
				e.target.getAttribute('contenteditable') ||
				e.target.tagName === 'TEXTAREA'
			) {
				return;
			}

			isDown = true;
			sliderContainer[c].classList.add('active');
			startX = e.pageX - sliderContainer[c].offsetLeft;
			scrollLeft = sliderContainer[c].scrollLeft;
		});
		sliderContainer[c].addEventListener('mouseleave', () => {
			isDown = false;
			sliderContainer[c].classList.remove('active');
		});
		sliderContainer[c].addEventListener('mouseup', () => {
			isDown = false;
			sliderContainer[c].classList.remove('active');
		});
		sliderContainer[c].addEventListener('mousemove', (e) => {
			if (!isDown) return;
			e.preventDefault();
			const x = e.pageX - sliderContainer[c].offsetLeft;
			const walk = x - startX;
			sliderContainer[c].scrollLeft = scrollLeft - walk;
			position = sliderContainer[c].scrollLeft;
		});
	}
})();
