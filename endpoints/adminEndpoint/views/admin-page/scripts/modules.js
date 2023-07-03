/**
 * Retrieves the authentication token from the cookies.
 *
 * @returns {string|null} The token value if found, or null if not found.
 */
function getToken() {
	const cookies = document.cookie.split(';');

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();

		if (cookie.startsWith('token=')) {
			document.cookie =
				'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

			return cookie.substring('token'.length + 1);
		}
	}

	return null;
}

const token = getToken();

/**
 * Retrieves the website data from the server.
 *
 * @returns {Promise} A promise that resolves to the JSON response containing the website data.
 */
export async function getWebsite() {
	return await (
		await fetch('/admin/api/website', {
			method: 'POST',
			headers: { authorization: `Bearer ${token}` },
		})
	).json();
}

/**
 * Retrieves the header data from the server.
 *
 * @returns {Promise} A promise that resolves to the JSON response containing the header data.
 */
async function getHeader() {
	return await (
		await fetch('/admin/api/header', {
			method: 'POST',
			headers: { authorization: `Bearer ${token}` },
		})
	).json();
}

/**
 * Retrieves the propaganda data from the server.
 *
 * @returns {Promise} A promise that resolves to the JSON response containing the propaganda data.
 */
async function getPropagandas() {
	return await (
		await fetch('/admin/api/propagandas', {
			method: 'POST',
			headers: { authorization: `Bearer ${token}` },
		})
	).json();
}

/**
 * Retrieves the categories data from the server.
 *
 * @returns {Promise} A promise that resolves to the JSON response containing the categories data.
 */
async function getCategories() {
	return await (
		await fetch('/admin/api/categories', {
			method: 'POST',
			headers: { authorization: `Bearer ${token}` },
		})
	).json();
}

/**
 * Retrieves the product data from the server.
 *
 * @returns {Promise} A promise that resolves to the JSON response containing the product data.
 */
export async function getProducts() {
	return await (
		await fetch('/admin/api/products', {
			method: 'POST',
			headers: { authorization: `Bearer ${token}` },
		})
	).json();
}

/**
 * Function to build aside menus and attach click handlers to toggle their visibility.
 * @param {Array} asideButtonHandler - An array of objects containing selector, element, and action properties.
 */
export function buildAsideMenus(asideButtonHandler) {
	const addClickHandler = (selector, element, action) => {
		document.querySelectorAll(`button[${selector}]`).forEach((button) => {
			button.addEventListener('click', () => {
				setTimeout(() => {
					element.classList[action]('--on');
				}, 120);
			});
		});
	};

	asideButtonHandler.forEach(({ selector, element, action }) => {
		addClickHandler(selector, element, action);
	});
}

/**
 * Calculates the total website accesses based on the provided 'dates' object.
 * It iterates over each month in the 'dates' object and adds up the number of accesses.
 * If there are accesses, it updates the corresponding paragraph element in the DOM to display the total accesses for the current year.
 * @param {Object} dates - The dates object containing website access data grouped by month.
 */
export function buildWebsiteAccesses(dates) {
	let accesses = 0;

	Object.keys(dates).forEach((month) => {
		accesses = accesses + dates[month].length;
	});

	if (accesses !== 0) {
		window.document.querySelector(
			'p[total-website-accesses]',
		).innerText = `${accesses
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ${
			accesses > 1 ? 'acessos' : 'acesso'
		} neste ano`;
	}
}

/**
 * Calculates the total clicks for all products based on the provided 'products' object.
 * It iterates over each category and product in the 'products' object and adds up the number of clicks from their respective history arrays.
 * If there are clicks, it updates the corresponding paragraph element in the DOM to display the total clicks for the current year.
 * @param {Object} products - The products object containing product data grouped by category.
 */
export function buildProductTotalClicks(products) {
	let clicks = 0;

	Object.keys(products).forEach((category) => {
		products[category].forEach((product) => {
			clicks = clicks + product.history.length;
		});
	});

	if (clicks !== 0) {
		window.document.querySelector(
			'p[total-products-clicks]',
		).innerText = `${clicks.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ${
			clicks > 1 ? 'clicks' : 'click'
		} neste ano`;
	}
}

/**
 * Determines the most clicked category based on the provided 'products' object.
 * It iterates over each category and calculates the total clicks by summing up the number of clicks from all products within each category.
 * It keeps track of the category with the highest number of clicks and updates the 'name' and 'clicks' variables accordingly.
 * If there are clicks, it updates the corresponding paragraph element in the DOM to display the most clicked category and the total clicks for the current year.
 * @param {Object} products - The products object containing product data grouped by category.
 */
export function buildMostClickedCategory(products) {
	let name = '';
	let clicks = 0;

	Object.keys(products).forEach((category) => {
		let _clicks = 0;

		products[category].forEach((product) => {
			_clicks = _clicks + product.history.length;
		});

		if (_clicks > clicks) {
			clicks = _clicks;
			name = category;
		}
	});

	if (clicks !== 0) {
		window.document.querySelector(
			'p[most-clicked-category]',
		).innerText = `${name} com ${clicks
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ${
			clicks > 1 ? 'clicks' : 'click'
		} neste ano`;
	}
}

/**
 * Builds the top products list based on the provided 'products' object.
 * It iterates through each category and sorts the products based on the number of clicks.
 * The top products are added to the 'topList' array, limited to 'max' number of products.
 * The template is used to create table rows for each top product, and the table is updated in the DOM.
 */
export async function buildTopProducts() {
	const products = await getProducts();

	const topList = [];
	const max = 10;

	Object.keys(products).forEach((category) => {
		products[category].forEach((product) => {
			product.category = category;
			product.history = product.history.length;

			if (product.history === 0) {
				return;
			}

			if (topList.length === 0) {
				topList.push(product);

				return;
			}

			for (let c = 0; c < topList.length; c++) {
				let item = topList[c];

				if (product.history > item.history) {
					topList.splice(c, 0, product);

					break;
				}

				if (product.history === item.history) {
					topList.splice(c + 1, 0, product);

					break;
				}

				if (topList.length < max && c === topList.length - 1) {
					topList.push(product);

					break;
				}
			}
		});
	});

	if (topList.length >= max) {
		topList.splice(max);
	}

	const template = window.document.querySelector(
		'template[top-products-template]',
	);

	const templateParent = template.parentElement;
	const oldItems = templateParent.querySelectorAll('tr[table-row]');

	topList.forEach((product, index) => {
		const templateUsable = template.content.cloneNode(true).children[0];

		templateUsable.setAttribute('table-row', '');

		templateUsable.querySelector('p[top-position]').innerText = `#${index + 1}`;
		templateUsable.querySelector(
			'p[product-name]',
		).innerText = `${product.name} (${product.category})`;
		templateUsable.querySelector('p[clicks-number]').innerText = `${
			product.history
		} ${product.history > 1 ? 'clicks' : 'click'}`;

		if (oldItems[index]) {
			templateParent.replaceChild(templateUsable, oldItems[index]);
		} else {
			templateParent.append(templateUsable);
		}
	});

	handleTableVisibility();
}

/**
 * Builds a line chart to display the website accesses for a specific month based on the provided 'dates' object.
 * It retrieves the canvas element and chart context from the DOM.
 * It processes the data in 'dates' to create the chart dataset.
 * It creates a linear gradient for the chart's background color using the primary color defined in the CSS.
 * It initializes a new Chart instance with the provided data and options.
 * @param {Object} dates - The dates object containing website access data for a specific month.
 */
export function buildWebsiteAccessesMonthChart(dates) {
	const canvas = window.document.querySelector(
		'div[access-history-chart-container] canvas',
	);
	const chartCanvas = canvas.getContext('2d');

	const year = Object.keys(dates);
	const month = Object.keys(dates[year]);
	const dataSchema = {};

	dates[year][month].forEach((date) => {
		const day = String(date.date).split(' ')[2];

		if (!dataSchema[day]) {
			dataSchema[day] = 0;
		}

		dataSchema[day]++;
	});

	const label = `Acessos no site em ${month}`;
	const labels = Object.keys(dataSchema).sort();
	const data = [];

	labels.forEach((day) => {
		data.push(dataSchema[day]);
	});

	const color = getComputedStyle(document.documentElement).getPropertyValue(
		'--primary-color',
	);

	const backgroundColor = chartCanvas.createLinearGradient(0, 0, 0, 400);
	backgroundColor.addColorStop(0, color);
	backgroundColor.addColorStop(1, hexToRGBA(color, 0.3));

	new Chart(chartCanvas, {
		type: 'line',
		data: {
			labels,
			datasets: [
				{
					data,
					label,
					fill: true,
					lineTension: 0.3,
					backgroundColor,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
		},
	});
}

/**
 * Builds a line chart to display the website accesses for each month in a specific year based on the provided 'dates' object.
 * It retrieves the canvas element and chart context from the DOM.
 * It defines the order of months in Portuguese.
 * It iterates over the 'dates' object to create the chart datasets for each year.
 * It determines the labels based on the order of months and the available data.
 * It creates the chart datasets with the corresponding data, labels, and options.
 * It creates a linear gradient for the last dataset's background color using the primary color defined in the CSS.
 * It sets the last dataset to be visible in the chart.
 * It initializes a new Chart instance with the provided data and options.
 * @param {Object} dates - The dates object containing website access data for each month in a specific year.
 */
export function buildWebsiteAccessesYearChart(dates) {
	const canvas = window.document.querySelector(
		'div[access-history-chart-container] canvas',
	);
	const chartCanvas = canvas.getContext('2d');

	const monthOrder = [
		'janeiro',
		'fevereiro',
		'março',
		'abril',
		'maio',
		'junho',
		'julho',
		'agosto',
		'setembro',
		'outubro',
		'novembro',
		'dezembro',
	];

	const datasets = [];
	let labels;

	Object.keys(dates).forEach((year) => {
		const label = `Acessos no site em ${year}`;

		const _labels = Object.keys(dates[year]).sort(
			(a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b),
		);

		if (!labels || _labels.length > labels.length) {
			labels = _labels;
		}

		const data = [];

		_labels.forEach((month) => {
			data.push(dates[year][month].length);
		});

		datasets.push({
			data,
			label,
			lineTension: 0.3,
			fill: true,
			hidden: true,
		});
	});

	const color = getComputedStyle(document.documentElement).getPropertyValue(
		'--primary-color',
	);

	const backgroundColor = chartCanvas.createLinearGradient(0, 0, 0, 400);
	backgroundColor.addColorStop(0, color);
	backgroundColor.addColorStop(1, hexToRGBA(color, 0.3));

	datasets[datasets.length - 1].backgroundColor = backgroundColor;
	datasets[datasets.length - 1].hidden = false;

	new Chart(chartCanvas, {
		type: 'line',
		data: {
			labels,
			datasets,
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
		},
	});
}

/**
 * Builds the icon for the web page based on the header data.
 */
export async function buildIcon() {
	const { icon } = await getHeader();

	window.document
		.querySelector('link[rel="shortcut icon"]')
		.setAttribute('href', icon);
}

/**
 * Builds the logo for the web page based on the header data.
 */
export async function buildLogo() {
	const { logo } = await getHeader();

	window.document.querySelectorAll('img[logo]').forEach((img) => {
		img.setAttribute('src', logo);
	});
}

/**
 * Builds the title for the web page based on the header data.
 */
export async function buildTitle() {
	const { title } = await getHeader();

	window.document.querySelector('title').innerText = title + ' | Admin';
}

/**
 * Builds the primary color for the web page based on the header data.
 */
export async function buildColor() {
	const { color } = await getHeader();

	window.document.documentElement.style.setProperty('--primary-color', color);

	window.document.querySelectorAll('canvas').forEach((canvas) => {
		const ctx = canvas.getContext('2d');
		const chart = Chart.getChart(ctx);

		const backgroundColor = ctx.createLinearGradient(0, 0, 0, 400);
		backgroundColor.addColorStop(0, color);
		backgroundColor.addColorStop(1, hexToRGBA(color, 0.3));

		chart.data.datasets.forEach(function (dataset) {
			dataset.borderColor = backgroundColor;
			dataset.backgroundColor = backgroundColor;
		});

		chart.update();
	});
}

/**
 * Builds a complex table for a specific section on the web page.
 *
 * @param {Function} apiListBuilder - A function that builds the API list.
 * @param {string} sectionName - The name of the section.
 * @param {Function} cellFunction - A function that handles each cell in the table.
 * @param {string} deleteItemApiUrl - The API URL for deleting an item.
 * @param {string} reorderItemsApiUrl - The API URL for reordering items.
 * @param {Object} options - Optional parameters for customization.
 * @param {boolean} [options.isLastItemNew=false] - Indicates if the last item is new.
 * @param {Function} [options.deleteItemCallback=undefined] - A callback function to be called after deleting an item.
 */
async function buildComplexTable(
	apiListBuilder,
	sectionName,
	cellFunction,
	deleteItemApiUrl,
	reorderItemsApiUrl,
	{ isLastItemNew = false, deleteItemCallback = undefined },
) {
	const apiList = await apiListBuilder();

	const template = window.document.querySelector(
		`template[${sectionName}-template]`,
	);

	handleTableVisibility();

	if (sectionName === 'products') {
		const categories = await getCategories();

		Object.keys(apiList)
			.reverse()
			.forEach((apiItem) => {
				apiList[apiItem].reverse().forEach((apiItem) => {
					handleApiList(apiItem, {
						option: categories,
						templateProperties: (template) => {
							template.setAttribute('category', apiItem.category);
							loadProductInputsProperties(template);
						},
					});
				});
			});
	} else {
		apiList.reverse().forEach((apiItem, index) => {
			handleApiList(apiItem);
		});
	}

	const templateParent = template.parentElement;

	if (isLastItemNew) {
		const trList = templateParent.querySelectorAll('tr[original-item]');
		trList[trList.length - 1]
			.querySelector('div[action-info]')
			.classList.add('--ok');
	}

	templateParent.setAttribute(`sortable-${sectionName}`, '');

	handleTableVisibility();

	addSortableList(`sortable-${sectionName}`, async () => {
		let ids = [];

		template.parentElement
			.querySelectorAll('tr[original-item]')
			.forEach((tr) => {
				ids.push(tr.getAttribute('identifier'));
			});

		const form = JSON.stringify({
			ids,
		});

		await fetch(reorderItemsApiUrl, {
			method: 'PUT',
			headers: {
				authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
			body: form,
		});
	});

	if (
		template.parentElement.querySelectorAll('tr[original-item]').length <= 1
	) {
		destroySortableList(`sortable-${sectionName}`);
	}

	function handleApiList(
		apiItem,
		{ option = undefined, templateProperties = undefined } = {},
	) {
		const templateUsable = template.content.cloneNode(true).children[0];

		templateUsable.setAttribute('original-item', '');
		templateUsable.setAttribute('identifier', apiItem.id);
		templateUsable
			.querySelector('td[action-container]')
			.classList.add('--no-send-button');

		templateUsable
			.querySelectorAll('div[cell-container]')
			.forEach((cell, index) => {
				if (option) {
					cellFunction(apiItem, cell, index, option);
				} else {
					cellFunction(apiItem, cell, index);
				}
			});

		if (templateProperties) {
			templateProperties(templateUsable);
		}

		const actionContainer = templateUsable.querySelector(
			'td[action-container]',
		);

		const actionButtons = actionContainer.querySelectorAll('button');

		actionButtons[2].addEventListener('click', async () => {
			if (
				sectionName === 'categories' &&
				templateUsable
					.querySelector('div[cell-container]')
					.getAttribute('count') != 0
			) {
				const count = templateUsable
					.querySelector('div[cell-container]')
					.getAttribute('count');

				const confirm = await handleConfirmCategoryDeletion(
					apiItem.name,
					count,
				);

				if (!confirm) {
					return;
				}
			}

			let form = {};

			form['id'] = String(apiItem.id);

			form = JSON.stringify(form);

			const req = await handleActionRequest(
				actionContainer,
				deleteItemApiUrl,
				'DELETE',
				form,
				'application/json',
			);

			if (req) {
				if (deleteItemCallback) {
					await deleteItemCallback(apiItem.id);
				}

				templateUsable.remove();

				buildComplexTable(
					apiListBuilder,
					sectionName,
					cellFunction,
					deleteItemApiUrl,
					reorderItemsApiUrl,
					{ deleteItemCallback },
				);
			}
		});

		const oldItem = template.parentElement.querySelector(
			`tr[identifier="${apiItem.id}"]`,
		);

		const newItem = template.parentElement.querySelector(`tr[new-item]`);

		if (oldItem) {
			template.parentElement.replaceChild(templateUsable, oldItem);
		} else if (newItem) {
			template.parentElement.replaceChild(templateUsable, newItem);
		} else {
			template.parentElement.prepend(templateUsable);
		}
	}
}

/**
 * Builds the propagandas section on the web page.
 *
 * @param {boolean} [isLastItemNew=false] - Indicates if the last item is new.
 */
export function buildPropagandas(isLastItemNew = false) {
	const apiListBuilder = async () => await getPropagandas();
	const sectionName = 'propagandas';
	const deleteItemApiUrl = '/admin/api/propaganda';
	const reorderItemsApiUrl = '/admin/api/propagandas';
	const cellFunction = (apiItem, cell, index) => {
		cell.setAttribute(
			'action',
			`/admin/api/propagandas/${index === 0 ? 'big-image' : 'small-image'}`,
		);

		cell.querySelectorAll('div[file-input-container]').forEach((div) => {
			const key = generateRandomString(30);

			div.querySelector('label').setAttribute('for', key);
			const input = div.querySelector('input');

			input.setAttribute('id', key);

			input.addEventListener('input', async (e) => {
				const form = new FormData();

				form.append('file', e.target.files[0]);
				form.append('id', String(apiItem.id));

				await handleCellRequest(cell, form);
			});

			const link = div.querySelector('a');
			link.setAttribute(
				'href',
				index === 0 ? apiItem['big-image'] : apiItem['small-image'],
			);

			link.innerText = `${link.innerText} ${apiItem.id}`;

			link.querySelectorAll('br').forEach((br) => {
				br.remove();
			});

			loadFileInputProperties(div);
		});
	};

	buildComplexTable(
		apiListBuilder,
		sectionName,
		cellFunction,
		deleteItemApiUrl,
		reorderItemsApiUrl,
		{
			isLastItemNew,
		},
	);
}

/**
 * Builds the categories section on the web page.
 *
 * @param {boolean} [isLastItemNew=false] - Indicates if the last item is new.
 */
export function buildCategories(isLastItemNew = false) {
	const apiListBuilder = async () => await getCategories();
	const sectionName = 'categories';
	const deleteItemApiUrl = '/admin/api/category';
	const reorderItemsApiUrl = '/admin/api/categories';
	const cellFunction = (apiItem, cell, index) => {
		cell.setAttribute('count', apiItem.productCount);
		cell.setAttribute('action', '/admin/api/categories/name');

		cell.querySelectorAll('div[pseudo-input]').forEach(async (div) => {
			div.innerText = apiItem.name;

			loadPseudoInputProperties(div);

			let lastInnerText = div.innerText;

			div.addEventListener('focusout', async () => {
				const currentValue = div.innerText;

				handleTextInputRequest(
					lastInnerText,
					cell,
					'name',
					div.innerText,
					String(apiItem.id),
					async () => await buildProductsTemplateCallback(),
				);

				lastInnerText = currentValue;
			});
		});
	};

	const deleteItemCallback = async (id) => {
		await buildProducts();
		await buildProductsTemplateCallback();

		window.document.querySelectorAll(`tr[category='${id}']`).forEach((tr) => {
			tr.remove();
		});
	};

	buildComplexTable(
		apiListBuilder,
		sectionName,
		cellFunction,
		deleteItemApiUrl,
		reorderItemsApiUrl,
		{
			isLastItemNew,
			deleteItemCallback,
		},
	);
}

/**
 * Builds the product categories select element with the provided categories.
 *
 * @param {Array} categories - The array of category objects.
 * @param {HTMLSelectElement} select - The select element to build the options.
 * @param {string} [selected=''] - The ID of the selected category.
 */
function buildProductCategoriesSelect(categories, select, selected = '') {
	const selectedOptions = [];
	const selectedIndex = select.selectedIndex;

	select.querySelectorAll('option').forEach((option) => {
		selectedOptions.push(false);
		option.remove();
	});

	selectedOptions[selectedIndex] = true;

	categories.forEach((category, index) => {
		const template = select.querySelector('template').content.cloneNode(true)
			.children[0];

		template.setAttribute('value', category.id);
		template.innerText = category.name;

		if (selectedOptions[index]) {
			template.setAttribute('selected', '');
		}

		if (selected === category.id) {
			template.setAttribute('selected', '');
		}

		select.append(template);
	});
}

/**
 * Builds the products table with the provided API data.
 *
 * @param {boolean} [isLastItemNew=false] - Determines if the last item is new.
 */
export async function buildProducts(isLastItemNew = false) {
	const apiListBuilder = async () => await getProducts();
	const sectionName = 'products';
	const deleteItemApiUrl = '/admin/api/product';
	const reorderItemsApiUrl = '/admin/api/products';
	const cellFunction = (apiItem, cell, index, categories) => {
		cell.querySelectorAll('div[file-input-container]').forEach((div) => {
			cell.setAttribute('action', '/admin/api/products/image');

			div.querySelectorAll('input').forEach((input) => {
				input.addEventListener('input', async (e) => {
					const form = new FormData();

					form.append('file', e.target.files[0]);
					form.append('id', apiItem.id);

					await handleCellRequest(cell, form);
				});
			});

			div.querySelector('a').setAttribute('href', apiItem.image);

			loadFileInputProperties(div);
		});

		cell.querySelectorAll('select[product-category]').forEach((select) => {
			cell.setAttribute('action', '/admin/api/products/category');

			select.addEventListener('change', async (e) => {
				await handleTextInputRequest(
					false,
					cell,
					'category',
					e.target.value,
					String(apiItem.id),
				);
			});

			buildProductCategoriesSelect(categories, select, apiItem.category);
		});

		cell.querySelectorAll('div[product-name]').forEach((div) => {
			cell.setAttribute('action', '/admin/api/products/name');

			div.innerText = apiItem.name;

			let lastInnerText = div.innerText;

			div.addEventListener('focusout', async () => {
				const currentInnerText = div.innerText;

				await handleTextInputRequest(
					lastInnerText,
					cell,
					'name',
					currentInnerText,
					String(apiItem.id),
				);

				lastInnerText = currentInnerText;
			});
		});

		cell.querySelectorAll('div[product-price]').forEach((div) => {
			cell.setAttribute('action', '/admin/api/products/price');

			div.innerText = convertToMoneyFormat(apiItem.price);

			let lastInnerText = div.innerText
				.replace(/[^\d,-]/g, '')
				.replace(',', '.');

			div.addEventListener('focusout', async () => {
				const currentInnerText = div.innerText
					.replace(/[^\d,-]/g, '')
					.replace(',', '.');

				await handleTextInputRequest(
					lastInnerText,
					cell,
					'price',
					currentInnerText,
					String(apiItem.id),
				);

				lastInnerText = currentInnerText;
			});
		});

		cell.querySelectorAll('div[product-off]').forEach((div) => {
			cell.setAttribute('action', '/admin/api/products/off');

			div.innerText = apiItem.off;

			formatOff(div);

			let lastInnerText = div.innerText.replace(/\D/g, '');

			div.addEventListener('focusout', async () => {
				const currentInnerText =
					div.innerText.replace(/\D/g, '') === ''
						? '0'
						: div.innerText.replace(/\D/g, '');

				await handleTextInputRequest(
					lastInnerText,
					cell,
					'off',
					currentInnerText,
					String(apiItem.id),
				);

				lastInnerText = currentInnerText;
			});
		});

		cell.querySelectorAll('div[product-installment]').forEach((div) => {
			cell.setAttribute('action', '/admin/api/products/installment');

			div.innerText = apiItem.installment;

			let lastInnerText = div.innerText;

			div.addEventListener('focusout', async () => {
				const currentInnerText = div.innerText;

				await handleTextInputRequest(
					lastInnerText,
					cell,
					'installment',
					currentInnerText,
					String(apiItem.id),
				);

				lastInnerText = currentInnerText;
			});
		});

		cell.querySelectorAll('div[product-whatsapp]').forEach((div) => {
			cell.setAttribute('action', '/admin/api/products/whatsapp');

			div.innerText = apiItem.whatsapp;
			formatWhatsapp(div);

			let lastInnerText = div.innerText.replace(/\D/g, '');

			div.addEventListener('focusout', async () => {
				const currentInnerText = div.innerText.replace(/\D/g, '');

				await handleTextInputRequest(
					lastInnerText,
					cell,
					'whatsapp',
					currentInnerText,
					String(apiItem.id),
				);

				lastInnerText = currentInnerText;
			});
		});

		cell.querySelectorAll('div[product-message]').forEach((div) => {
			cell.setAttribute('action', '/admin/api/products/message');

			div.innerText = apiItem.message;

			let lastInnerText = div.innerText;

			div.addEventListener('focusout', async () => {
				const currentInnerText = div.innerText;

				await handleTextInputRequest(
					lastInnerText,
					cell,
					'message',
					currentInnerText,
					String(apiItem.id),
				);

				lastInnerText = currentInnerText;
			});
		});
	};

	const deleteItemCallback = async () => await buildTopProducts();

	buildComplexTable(
		apiListBuilder,
		sectionName,
		cellFunction,
		deleteItemApiUrl,
		reorderItemsApiUrl,
		{
			isLastItemNew,
			deleteItemCallback,
		},
	);
}

/**
 * Builds the template for propagandas in the special section.
 *
 * @param {Element} specialSection - The special section element.
 * @returns {Element} - The cloned template element.
 */
export function buildPropagandasTemplate(specialSection) {
	const template = specialSection
		.querySelector('template[propagandas-template]')
		.content.cloneNode(true).children[0];

	template.setAttribute('pseudo-item', '');

	template
		.querySelector('td[action-container]')
		.classList.add('--no-drag-button');

	template.querySelectorAll('div[file-input-container]').forEach((div) => {
		const key = generateRandomString(30);

		div.querySelector('label').setAttribute('for', key);
		div.querySelector('input').setAttribute('id', key);

		loadFileInputProperties(div);
	});

	const actionContainer = template.querySelector('td[action-container]');
	const actionButtons = actionContainer.querySelectorAll('button');

	actionButtons[1].addEventListener('click', async () => {
		const form = new FormData();
		const files = template.querySelectorAll('input');

		form.append('files', files[0].files[0]);
		form.append('files', files[1].files[0]);

		form.append('imagesContext', 'bigImage');
		form.append('imagesContext', 'smallImage');

		const req = await handleActionRequest(
			actionContainer,
			'/admin/api/propaganda',
			'POST',
			form,
		);

		if (req) {
			template.setAttribute('new-item', '');

			buildPropagandas(true);
		}
	});

	actionButtons[2].addEventListener('click', () => {
		template.remove();

		handleTableVisibility();
	});

	return template;
}

/**
 * Builds the template for categories in the special section.
 *
 * @param {Element} specialSection - The special section element.
 * @returns {Element} - The cloned template element.
 */
export function buildCategoriesTemplate(specialSection) {
	const template = specialSection
		.querySelector('template[categories-template]')
		.content.cloneNode(true).children[0];

	template.setAttribute('pseudo-item', '');

	template
		.querySelector('td[action-container]')
		.classList.add('--no-drag-button');

	template.querySelectorAll('div[pseudo-input]').forEach((div) => {
		loadPseudoInputProperties(div);
	});

	const actionContainer = template.querySelector('td[action-container]');
	const actionButtons = actionContainer.querySelectorAll('button');

	actionButtons[1].addEventListener('click', async () => {
		let form = {
			name: template.querySelector('div[pseudo-input]').innerText,
		};

		form = JSON.stringify(form);

		const req = await handleActionRequest(
			actionContainer,
			'/admin/api/category',
			'POST',
			form,
			'application/json',
		);

		if (req) {
			template.setAttribute('new-item', '');

			buildCategories(true);
			await buildProductsTemplateCallback();
		}
	});

	actionButtons[2].addEventListener('click', () => {
		template.remove();

		handleTableVisibility();
	});

	return template;
}

/**
 * Builds the template for products in the special section.
 *
 * @param {Element} specialSection - The special section element.
 * @returns {Element} - The cloned template element.
 */
export function buildProductsTemplate(specialSection) {
	const template = specialSection
		.querySelector('template[products-template]')
		.content.cloneNode(true).children[0];

	template.setAttribute('pseudo-item', '');

	template
		.querySelector('td[action-container]')
		.classList.add('--no-drag-button');

	loadProductInputsProperties(template);

	const actionContainer = template.querySelector('td[action-container]');
	const actionButtons = actionContainer.querySelectorAll('button');

	actionButtons[1].addEventListener('click', async () => {
		const form = new FormData();

		const image = template.querySelector('input[product-image]').files[0];
		form.append('file', image);

		const category = template.querySelector('select[product-category]').value;
		form.append('category', category);

		const name = template.querySelector('div[product-name]').innerText;
		form.append('name', name);

		const price = String(
			parseFloat(
				template
					.querySelector('div[product-price]')
					.innerText.replace(/[^\d,-]/g, '')
					.replace(',', '.'),
			).toFixed(2),
		);
		form.append('price', price);

		const off = template
			.querySelector('div[product-off]')
			.innerText.replace(/\D/g, '');
		form.append('off', off === '' ? '0' : off);

		const installment = template.querySelector(
			'div[product-installment]',
		).innerText;
		form.append('installment', installment);

		const whatsapp = template
			.querySelector('div[product-whatsapp]')
			.innerText.replace(/\D/g, '');
		form.append('whatsapp', whatsapp);

		const message = template.querySelector('div[product-message]').innerText;
		form.append('message', message);

		const req = await handleActionRequest(
			actionContainer,
			'/admin/api/product',
			'POST',
			form,
		);

		if (req) {
			template.setAttribute('new-item', '');

			await buildProducts(true);
			buildCategories();
		}
	});

	actionButtons[2].addEventListener('click', () => {
		template.remove();
		handleTableVisibility();
	});

	return template;
}

/**
 * Callback function used after building the products template.
 * It retrieves the categories and updates the product categories select elements.
 */
export async function buildProductsTemplateCallback() {
	const categories = await getCategories();

	window.document
		.querySelectorAll('select[product-categories-select]')
		.forEach((select) => {
			buildProductCategoriesSelect(categories, select);
		});
}

/**
 * Handles the cursor index within a pseudo input element.
 * @param {HTMLDivElement} div - The pseudo input element.
 */
function handlePseudoInputCursorIndex(div) {
	const selection = window.getSelection();
	const range = document.createRange();
	const index = div.innerText.length;

	if (div.innerText === '') {
		return;
	}

	range.setStart(div.firstChild || '', index);
	range.collapse(true);

	selection.removeAllRanges();
	selection.addRange(range);
}

/**
 * Loads file input properties and updates the link and file name display.
 * @param {HTMLDivElement} div - The file input container element.
 */
export function loadFileInputProperties(div) {
	const link = $(div).find('a');
	const fileInput = $(div).find('input');

	fileInput.on('input', function (e) {
		const file = e.target.files[0];
		const fileURL = URL.createObjectURL(file);

		link.attr('href', fileURL);
		link.text(e.target.files[0].name);
	});
}

/**
 * Loads pseudo input properties and adds event listeners for input and keydown events.
 * @param {HTMLDivElement} div - The pseudo input element.
 */
export function loadPseudoInputProperties(div) {
	let lastInput = div.innerText;

	div.addEventListener('paste', (e) => {
		e.preventDefault();

		var clipboardData = e.clipboardData || window.clipboardData;
		var plainText = clipboardData.getData('text/plain');

		document.execCommand('insertText', false, plainText);
	});

	div.addEventListener('input', () => {
		const value = div.innerText;
		const maxLength = Number(div.getAttribute('maxlength'));

		if (value.length > maxLength) {
			div.innerText = lastInput;
			handlePseudoInputCursorIndex(div);
		} else {
			lastInput = value;
		}
	});

	div.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.target.blur();
			return e.preventDefault();
		}
	});
}

/**
 * Formats the WhatsApp input value based on its length and updates the input element's text content.
 * @param {HTMLDivElement} inputElement - The WhatsApp input element.
 */
function formatWhatsapp(inputElement) {
	let value = String(inputElement.innerText.replace(/\D/g, ''));

	if (value.length === 0) {
		inputElement.innerText = '';
	} else if (value.length <= 2) {
		inputElement.innerText = `+${value}`;
	} else if (value.length === 3) {
		inputElement.innerText = `+${value.slice(0, 2)} (${value.charAt(2)})`;
	} else if (value.length <= 4) {
		inputElement.innerText = `+${value.slice(0, 2)} (${value.slice(2, 4)})`;
	} else if (value.length <= 9) {
		inputElement.innerText = `+${value.slice(0, 2)} (${value.slice(
			2,
			4,
		)}) ${value.slice(4, 9)}`;
	} else {
		inputElement.innerText = `+${value.slice(0, 2)} (${value.slice(
			2,
			4,
		)}) ${value.slice(4, 9)}-${value.slice(9, 13)}`;
	}
}

/**
 * Formats the discount percentage input value and updates the input element's text content.
 * @param {HTMLDivElement} inputElement - The discount percentage input element.
 */
function formatOff(inputElement) {
	let value = inputElement.innerText.replace(/\D/g, '');

	if (value === '') {
		inputElement.innerText = '';

		return;
	}

	value = Number(inputElement.innerText.replace(/\D/g, ''));

	if (value > 100) {
		inputElement.innerText = '100%';
	} else {
		inputElement.innerText = value + '%';
	}

	handlePseudoInputCursorIndex(inputElement);
}

/**
 * Formats the price input value and updates the input element's text content.
 * @param {HTMLDivElement} inputElement - The price input element.
 */
function formatPrice(inputElement) {
	const value = String(Number(inputElement.innerText.replace(/\D/g, '')));

	if (value.length <= 3) {
		if (value.length === 1) {
			inputElement.innerText = `R$ 0,0${value}`;
		} else if (value.length === 2) {
			inputElement.innerText = `R$ 0,${value}`;
		} else if (value.length === 3) {
			inputElement.innerText = `R$ ${value.charAt(0)},${value.slice(1, 3)}`;
		}
	} else {
		const dollars = value.slice(0, -2);
		const cents = value.slice(-2);

		const formattedDollars = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

		let formattedValue = `${formattedDollars},${cents}`;

		if (formattedValue === ',') {
			formattedValue += '00';
		}

		inputElement.innerText = `R$ ${formattedValue}`;
	}

	handlePseudoInputCursorIndex(inputElement);
}

/**
 * Loads WhatsApp properties and adds event listeners to handle input and formatting.
 * @param {HTMLDivElement} div - The WhatsApp input container element.
 */
export function loadWhatsappProperties(div) {
	formatWhatsapp(div);

	div.addEventListener('keydown', (event) => {
		const inputElement = event.target;
		let value = String(inputElement.innerText.replace(/\D/g, ''));

		if (event.key === 'Backspace') {
			if (value.length === 4) {
				inputElement.innerText = `+${value.slice(0, 2)} (${value.slice(2, 3)})`;
			}

			if (value.length === 3) {
				inputElement.innerText = value.slice(0, 3);
			}

			handlePseudoInputCursorIndex(inputElement);
		}
	});

	div.addEventListener('input', (event) => {
		const inputElement = event.target;

		formatWhatsapp(inputElement);

		handlePseudoInputCursorIndex(inputElement);
	});
}

/**
 * Loads product input properties and adds event listeners to handle input and formatting.
 * @param {HTMLElement} template - The product template element.
 */
function loadProductInputsProperties(template) {
	template.querySelectorAll('div[file-input-container]').forEach((div) => {
		const key = generateRandomString(30);

		div.querySelector('label').setAttribute('for', key);
		div.querySelector('input').setAttribute('id', key);

		loadFileInputProperties(div);
	});

	const pseudoInputs = template.querySelectorAll('div[pseudo-input]');

	pseudoInputs.forEach((div) => {
		loadPseudoInputProperties(div);
	});

	pseudoInputs[1].addEventListener('keydown', (event) => {
		const inputElement = event.target;
		const value = inputElement.innerText.replace(/\D/g, '');

		if (event.key === 'Backspace') {
			inputElement.innerText = value.slice(0, -1);
			event.preventDefault();
			formatPrice(inputElement);
		}
	});

	pseudoInputs[1].addEventListener('input', (event) => {
		const inputElement = event.target;
		formatPrice(inputElement);
	});

	pseudoInputs[2].addEventListener('keydown', (event) => {
		const inputElement = event.target;
		const value = String(Number(inputElement.innerText.replace(/\D/g, '')));

		if (event.key === 'Backspace') {
			inputElement.innerText = value.slice(0, -1);
			formatOff(inputElement);
		}
	});

	pseudoInputs[2].addEventListener('input', (event) => {
		const inputElement = event.target;
		formatOff(inputElement);
	});

	loadWhatsappProperties(pseudoInputs[4]);
}

/**
 * Handles an action request by sending a request to the specified URL with the provided method, body, and headers.
 * @param {HTMLElement} actionContainer - The container element for the action.
 * @param {string} url - The URL to send the request to.
 * @param {string} method - The HTTP method for the request (e.g., 'GET', 'POST', 'PUT', 'DELETE').
 * @param {FormData | string | null} body - The body of the request.
 * @param {string | undefined} contentType - The content type of the request.
 * @returns {Promise<boolean>} A promise that resolves to true if the request is successful, false otherwise.
 */
async function handleActionRequest(
	actionContainer,
	url,
	method,
	body,
	contentType = undefined,
) {
	$('--loading');

	const headers = {
		authorization: `Bearer ${token}`,
	};

	if (contentType) {
		headers['Content-Type'] = contentType;
	}

	const req = await fetch(url, {
		method,
		headers,
		body,
	});

	const { status, message } = await req.json();

	if (status === 200) {
		$('--ok');
		return true;
	} else {
		if (status === 401) {
			window.document
				.querySelector('div[multiple-windows-warning]')
				.classList.add('--on');
		}

		$('--error', message);
		return false;
	}

	/**
	 * Updates the action info element with the provided state and title.
	 * @param {string} add - The state to add to the action info element ('--loading', '--error', '--ok').
	 * @param {string | undefined} title - The title for the action info element.
	 */
	function $(add, title = undefined) {
		const states = ['--loading', '--error', '--ok'];
		const info = actionContainer.querySelector('div[action-info]');

		states.forEach((state) => {
			if (info.classList.contains(state)) {
				info.classList.remove(state);
			}
		});

		info.classList.add(add);

		if (title) {
			info.querySelector('i[action-info-error]').setAttribute('title', title);
		}
	}
}

/**
 * Handles a cell request by sending a PUT request to the action URL specified in the cell's attribute with the provided body and headers.
 * @param {HTMLElement} cell - The cell element representing the action.
 * @param {FormData | string | null} body - The body of the request.
 * @param {string | undefined} contentType - The content type of the request.
 * @returns {Promise<boolean>} A promise that resolves to true if the request is successful, false otherwise.
 */
export async function handleCellRequest(cell, body, contentType = undefined) {
	$('--loading');

	const action = cell.getAttribute('action');

	const headers = {
		authorization: `Bearer ${token}`,
	};

	if (contentType) {
		headers['Content-Type'] = contentType;
	}

	const req = await fetch(action, {
		method: 'PUT',
		headers,
		body,
	});

	const { status, message } = await req.json();

	if (status === 200) {
		$('--ok');
		return true;
	} else {
		if (status === 401) {
			window.document
				.querySelector('div[multiple-windows-warning]')
				.classList.add('--on');
		}

		$('--error', message);
		return false;
	}

	/**
	 * Updates the cell info element with the provided state and title.
	 * @param {string} add - The state to add to the cell info element ('--loading', '--error', '--ok').
	 * @param {string | undefined} title - The title for the cell info element.
	 */
	function $(add, title = undefined) {
		const states = ['--loading', '--error', '--ok'];
		const info = cell.querySelector('div[cell-info]');

		states.forEach((state) => {
			if (info.classList.contains(state)) {
				info.classList.remove(state);
			}
		});

		info.classList.add(add);

		if (title) {
			info.querySelector('i[cell-info-error]').setAttribute('title', title);
		}
	}
}

/**
 * Handles a text input request by sending a PUT request with the updated value to the server.
 * @param {string} lastInnerText - The last recorded inner text of the input element.
 * @param {HTMLElement} cell - The cell element representing the action.
 * @param {string} forItem - The key representing the item being updated.
 * @param {string} value - The new value of the input element.
 * @param {string} identifier - The identifier for the item being updated.
 * @param {function | undefined} callBack - An optional callback function to execute after the request is successful.
 * @returns {Promise<void>} A promise that resolves once the request is handled and, if provided, the callback function is executed.
 */
export async function handleTextInputRequest(
	lastInnerText,
	cell,
	forItem,
	value,
	identifier,
	callBack = undefined,
) {
	if (value === lastInnerText) {
		return;
	}

	let form = {};
	form[forItem] = value;
	form['id'] = identifier;
	form = JSON.stringify(form);

	const req = await handleCellRequest(cell, form, 'application/json');

	if (req && callBack) {
		await callBack();
	}
}

/**
 * Handles the visibility of tables in special sections.
 */
export function handleTableVisibility() {
	window.document.querySelectorAll('div[table-visibility]').forEach((div) => {
		const rows = div.querySelectorAll('tr[table-row]');

		if (rows.length === 0) {
			div.querySelector('div[table-container]').classList.add('--off');
		} else {
			div.querySelector('div[table-container]').classList.remove('--off');
		}
	});
}

/**
 * Adds sortable behavior to a list using jQuery UI Sortable.
 * @param {string} sectionName - The attribute name of the sortable section.
 * @param {function} callBack - The callback function to execute when sorting stops.
 */
function addSortableList(sectionName, callBack) {
	$(function () {
		const container = `[${sectionName}]`;

		const sortable = $(container).sortable({
			items: 'tr:not([pseudo-item])',
			cancel: '[pseudo-item]',
			stop: callBack,
			tolerance: 'pointer',
			helper: 'clone', // Use 'clone' helper to maintain original widths
			start: function (_, ui) {
				ui.helper.find('th, td').each(function () {
					$(this).data('width', $(this).width());
				});

				ui.helper.css('box-shadow', '0 0 5px 2px rgba(0, 0, 0, 0.3)');
			},
			change: function (_, ui) {
				ui.helper.find('th, td:not(.action-container)').each(function () {
					$(this).width($(this).data('width'));
				});
			},
		});

		$(container).on('mousedown', '[draggable]', function () {
			if ($(container).find('[original-item]').length < 2) {
				return;
			}

			sortable.sortable('enable');
		});

		$(document).on('mouseup', function (e) {
			if ($(container).find('[original-item]').length < 2) {
				return;
			}

			if (!$(e.target).closest('[draggable]').length) {
				sortable.sortable('disable');
			}
		});
	});
}

/**
 * Destroys the sortable behavior for a given container.
 * @param {string} sectionName - The attribute selector of the container.
 */
function destroySortableList(sectionName) {
	$(function () {
		// Find the elements with the specified container attribute selector and destroy the sortable behavior
		$(`[${sectionName}]`).sortable('destroy');
	});
}

/**
 * Generates a random string of the specified length.
 * @param {number} length - The length of the random string.
 * @returns {string} - The generated random string.
 */
function generateRandomString(length) {
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';

	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters.charAt(randomIndex);
	}

	return result;
}

/**
 * Handles the confirmation of category deletion.
 *
 * @param {string} category - The name of the category to be deleted.
 * @param {number} count - The number of products associated with the category.
 * @returns {Promise<boolean>} A promise that resolves to a boolean value indicating whether to proceed with the deletion or not.
 */
async function handleConfirmCategoryDeletion(category, count) {
	const warningContainer = window.document.querySelector(
		'div[confirm-category-deletion-warning]',
	);

	warningContainer.classList.add('--on');
	warningContainer.querySelector(
		'p',
	).innerText = `Tem certeza que deseja deletar a categoria "${category}"? Esta categoria possui ${count} ${
		count == 1 ? `produto` : `produtos`
	}. Se você prosseguir com a exclusão, os produtos relacionados também serão removidos.`;

	const buttons = warningContainer.querySelectorAll('button');

	return await new Promise((resolve) => {
		buttons[0].addEventListener('click', () => {
			warningContainer.classList.remove('--on');

			destroyButtonsEventListeners();

			resolve(false);
		});

		buttons[1].addEventListener('click', () => {
			warningContainer.classList.remove('--on');

			destroyButtonsEventListeners();

			resolve(true);
		});
	});

	function destroyButtonsEventListeners() {
		buttons[0].parentNode.replaceChild(buttons[0].cloneNode(true), buttons[0]);
		buttons[1].parentNode.replaceChild(buttons[1].cloneNode(true), buttons[1]);
	}
}

/**
 * Converts a number to the Brazilian currency format.
 * @param {number} number - The number to be converted.
 * @returns {string} - The number in the Brazilian currency format.
 */
function convertToMoneyFormat(number) {
	return number.toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});
}

/**
 * Converts a hexadecimal color value to RGBA format with the specified alpha value.
 * It removes the '#' character from the beginning of the hex string.
 * It extracts the red, green, and blue values from the hex string and converts them to decimal.
 * It constructs and returns the RGBA string with the provided alpha value.
 * @param {string} hex - The hexadecimal color value to convert.
 * @param {number} alpha - The alpha value for the RGBA format (between 0 and 1).
 * @returns {string} The RGBA color value.
 */
function hexToRGBA(hex, alpha) {
	const hexValue = hex.replace('#', '');
	const r = parseInt(hexValue.substring(0, 2), 16);
	const g = parseInt(hexValue.substring(2, 4), 16);
	const b = parseInt(hexValue.substring(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
