/**
 * Retrieves the authentication token from the cookies.
 *
 * @returns {string|null} The token value if found, or null if not found.
 */
function getToken() {
	const cookies = document.cookie.split(';');

	for (let i = 0; i < cookies.length; i++) {
		const cookie = cookies[i].trim();

		if (cookie.startsWith('token' + '=')) {
			document.cookie =
				'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

			return cookie.substring('token'.length + 1);
		}
	}

	return null;
}

const token = getToken();

export async function getHeader() {
	return await (
		await fetch('/admin/api/header', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

async function getPropagandas() {
	return await (
		await fetch('/admin/api/propagandas', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

async function getCategories() {
	return await (
		await fetch('/admin/api/categories', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

async function getProducts() {
	return await (
		await fetch('/admin/api/products', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

//
// Build Interface
//

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

//
// Build Table
//

export async function buildIcon() {
	const { icon } = await getHeader();

	window.document
		.querySelector('link[rel="shortcut icon"]')
		.setAttribute('href', icon);
}

export async function buildLogo() {
	const { logo } = await getHeader();

	window.document.querySelectorAll('img[logo]').forEach((img) => {
		img.setAttribute('src', logo);
	});
}

export async function buildTitle() {
	const { title } = await getHeader();

	window.document.querySelector('title').innerText = title + ' | Admin';
}

export async function buildColor() {
	const { color } = await getHeader();

	window.document.documentElement.style.setProperty('--primary-color', color);
}

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

	template.parentElement.querySelectorAll('tr[original-item]').forEach((tr) => {
		tr.remove();
	});

	if (sectionName === 'products') {
		const categories = await getCategories();

		Object.keys(apiList)
			.reverse()
			.forEach((apiItem, index) => {
				apiList[apiItem].reverse().forEach((apiItem) => {
					handleApiList(apiItem, index, {
						option: categories,
						templateProperties: (template) =>
							loadProductInputProperties(template),
					});
				});
			});
	} else {
		apiList.reverse().forEach((apiItem, index) => {
			handleApiList(apiItem, index);
		});
	}

	template.parentElement.setAttribute(`sortable-${sectionName}`, '');

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
				authorization: 'Bearer ' + token,
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

	handleTableVisibility();

	//private function
	function handleApiList(
		apiItem,
		index,
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
					await deleteItemCallback();
				}

				buildComplexTable(
					apiListBuilder,
					sectionName,
					cellFunction,
					deleteItemApiUrl,
					reorderItemsApiUrl,
					{ isLastItemNew, deleteItemCallback },
				);
			}
		});

		if (isLastItemNew && index === 0) {
			templateUsable.querySelector('div[action-info]').classList.add('--ok');
		}

		template.parentElement.prepend(templateUsable);
	}
}

export function buildPropagandas(isLastItemNew = false) {
	const apiListBuilder = async () => await getPropagandas();
	const sectionName = 'propagandas';
	const deleteItemApiUrl = '/admin/api/propaganda';
	const reorderItemsApiUrl = '/admin/api/propagandas';
	const cellFunction = (apiItem, cell, index) => {
		cell.setAttribute(
			'action',
			'/admin/api/propagandas/' + (index === 0 ? 'bigImage' : 'smallImage'),
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
				index === 0 ? apiItem.bigImage : apiItem.smallImage,
			);
			link.innerText = link.innerText + ' ' + apiItem.id;

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

export function buildCategories(isLastItemNew = false) {
	const apiListBuilder = async () => await getCategories();
	const sectionName = 'categories';
	const deleteItemApiUrl = '/admin/api/category';
	const reorderItemsApiUrl = '/admin/api/categories';
	const cellFunction = (apiItem, cell, index) => {
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

	const deleteItemCallback = async () => {
		await buildProductsTemplateCallback();
		await buildProducts();
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

function buildProductCategoriesSelect(categories, select, selected = '') {
	const selectedOptions = [];

	select.querySelectorAll('option').forEach((option, index) => {
		const attributes = option.attributes;

		for (var i = 0; i < attributes.length; i++) {
			var attributeName = attributes[i].name;
			if (attributeName === 'selected') {
				selectedOptions.push(option.value);
			}
		}

		if (!selectedOptions[index]) {
			selectedOptions.push(false);
		}
		option.remove();
	});

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
				const currentInnerText = div.innerText.replace(/\D/g, '');

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

//
// Build Template
//

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
			template.setAttribute('original-item', '');
			buildPropagandas(true);
		}
	});

	actionButtons[2].addEventListener('click', () => {
		template.remove();
		handleTableVisibility();
	});

	return template;
}

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
			template.setAttribute('original-item', '');

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

export function buildProductsTemplate(specialSection) {
	const template = specialSection
		.querySelector('template[products-template]')
		.content.cloneNode(true).children[0];

	template.setAttribute('pseudo-item', '');

	template
		.querySelector('td[action-container]')
		.classList.add('--no-drag-button');

	loadProductInputProperties(template);

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
			template.setAttribute('original-item', '');

			await buildProducts(true);
		}
	});

	actionButtons[2].addEventListener('click', () => {
		template.remove();
		handleTableVisibility();
	});

	return template;
}

//
// Build Template Callback
//

export async function buildProductsTemplateCallback() {
	const categories = await getCategories();

	window.document
		.querySelectorAll('select[product-categories-select]')
		.forEach((select) => {
			buildProductCategoriesSelect(categories, select);
		});
}

//
// Others
//

export function handleCursorIndex(element) {
	const selection = window.getSelection();
	if (selection.rangeCount === 0) {
		return 0; // No selection, cursor at index 0
	}

	const range = selection.getRangeAt(0);
	const clonedRange = range.cloneRange();
	clonedRange.selectNodeContents(element);
	clonedRange.setEnd(range.startContainer, range.startOffset);

	const cursorIndex = clonedRange.toString().length;
	clonedRange.detach();

	return cursorIndex;
}

export function handlePseudoInputCursorIndex(div, index = undefined) {
	if (div.innerText === '') {
		return;
	}

	const range = document.createRange();
	const selection = window.getSelection();

	if (!index || index > div.innerText.length) {
		index = div.innerText.length; // Adjust index if it exceeds the div's text length
	}

	range.setStart(div.firstChild || '', index);
	range.collapse(true);

	selection.removeAllRanges();
	selection.addRange(range);
}

export function loadFileInputProperties(div) {
	const link = div.querySelector('a');
	const fileInput = div.querySelector('input');

	fileInput.addEventListener('input', (e) => {
		const file = e.target.files[0];
		const fileURL = URL.createObjectURL(file);

		link.href = fileURL;
		link.innerText = e.target.files[0].name;
	});
}

export function loadPseudoInputProperties(div) {
	let lastInput = div.innerText;

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

export function formatWhatsapp(inputElement) {
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

function formatOff(inputElement) {
	let value = Number(inputElement.innerText.replace(/\D/g, ''));

	if (value > 100) {
		inputElement.innerText = '100%';
	} else {
		inputElement.innerText = value + '%';
	}

	handlePseudoInputCursorIndex(inputElement);
}

function formatPrice(inputElement) {
	const value = String(Number(inputElement.innerText.replace(/\D/g, '')));

	if (value.length <= 3) {
		if (value.length === 1) {
			inputElement.innerText = 'R$ 0,0' + value;
		} else if (value.length === 2) {
			inputElement.innerText = 'R$ 0,' + value;
		} else if (value.length === 3) {
			inputElement.innerText =
				'R$ ' + value.charAt(0) + ',' + value.slice(1, 3);
		}
	} else {
		const dollars = value.slice(0, -2);
		const cents = value.slice(-2);

		const formattedDollars = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

		let formattedValue = formattedDollars + ',' + cents;

		if (formattedValue === ',') {
			formattedValue += '00';
		}

		inputElement.innerText = 'R$ ' + formattedValue;
	}

	handlePseudoInputCursorIndex(inputElement);
}

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

function loadProductInputProperties(template) {
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
		}

		formatOff(inputElement);
	});

	pseudoInputs[2].addEventListener('input', (event) => {
		const inputElement = event.target;

		formatOff(inputElement);
	});

	loadWhatsappProperties(pseudoInputs[4]);
}

export async function handleActionRequest(
	actionContainer,
	url,
	method,
	body,
	contentType = undefined,
) {
	$('--loading');

	const headers = {
		authorization: 'Bearer ' + token,
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
			window.document.querySelector('div[warning]').classList.add('--on');
		}

		$('--error', message);

		return false;
	}

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

export async function handleCellRequest(cell, body, contentType = undefined) {
	$('--loading');

	const action = cell.getAttribute('action');

	const headers = {
		authorization: 'Bearer ' + token,
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
			window.document.querySelector('div[warning]').classList.add('--on');
		}

		$('--error', message);

		return false;
	}

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

export function handleTableVisibility() {
	window.document.querySelectorAll('div[special-section]').forEach((div) => {
		const rows = div.querySelectorAll('tr[table-row]');

		if (rows.length === 0) {
			div.querySelector('div[table-container]').classList.add('--off');
		} else {
			div.querySelector('div[table-container]').classList.remove('--off');
		}
	});
}

function addSortableList(sectionName, callBack) {
	$(function () {
		const container = `[${sectionName}]`;

		const sortable = $(container).sortable({
			items: 'tr:not([pseudo-item])',
			cancel: '[pseudo-item]',
			stop: callBack,
			tolerance: 'pointer',
			helper: 'clone', // Use 'clone' helper to maintain original widths
			start: function (event, ui) {
				ui.helper.find('th, td').each(function () {
					$(this).data('width', $(this).width());
				});
			},
			change: function (event, ui) {
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

function destroySortableList(container) {
	$(function () {
		$('[' + container + ']').sortable('destroy');
	});
}

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

export function convertToMoneyFormat(number) {
	return number.toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});
}
