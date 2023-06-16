//
// Cookie
//

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

export const token = getToken();

//
// Get
//

export async function getHeader(token) {
	return await (
		await fetch('/admin/api/header', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

async function getPropagandas(token) {
	return await (
		await fetch('/admin/api/propagandas', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

async function getCategories(token) {
	return await (
		await fetch('/admin/api/categories', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

async function getProducts(token) {
	return await (
		await fetch('/admin/api/products', {
			method: 'POST',
			headers: { authorization: 'Bearer ' + token },
		})
	).json();
}

//
// Build
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

export async function buildIcon() {
	const { icon } = await getHeader(token);

	window.document
		.querySelector('link[rel="shortcut icon"]')
		.setAttribute('href', icon);
}

export async function buildLogo() {
	const { logo } = await getHeader(token);

	window.document.querySelectorAll('img[logo]').forEach((img) => {
		img.setAttribute('src', logo);
	});
}

export async function buildTitle() {
	const { title } = await getHeader(token);

	window.document.querySelector('title').innerText = title + ' | Admin';
}

export async function buildColor() {
	const { color } = await getHeader(token);

	window.document.documentElement.style.setProperty('--primary-color', color);
}

async function buildComplexTable(
	apiListBuilder,
	sectionName,
	cellFunction,
	deleteItemApiUrl,
	reorderItemsApiUrl,
	isLastItemNew = false,
) {
	const apiList = await apiListBuilder();

	const template = window.document.querySelector(
		`template[${sectionName}-template]`,
	);

	template.parentElement.querySelectorAll('tr[original-item]').forEach((tr) => {
		tr.remove();
	});

	if (sectionName === 'products') {
		//todo: build products
	} else {
		apiList.reverse().forEach((apiItem, index) => {
			const templateUsable = template.content.cloneNode(true).children[0];

			templateUsable.setAttribute('original-item', '');
			templateUsable.setAttribute('identifier', apiItem.id);
			templateUsable
				.querySelector('td[action-container]')
				.classList.add('--no-send-button');

			templateUsable
				.querySelectorAll('div[cell-container]')
				.forEach((cell, index) => cellFunction(apiItem, cell, index));

			const actionContainer = templateUsable.querySelector(
				'td[action-container]',
			);
			const actionButtons = actionContainer.querySelectorAll('button');

			actionButtons[2].addEventListener('click', async () => {
				let form = {};

				form['id'] = String(apiItem.id);

				form = JSON.stringify(form);

				const req = await handleActionRequest(
					token,
					actionContainer,
					deleteItemApiUrl,
					'DELETE',
					form,
					'application/json',
				);

				if (req) {
					buildComplexTable(
						apiListBuilder,
						sectionName,
						cellFunction,
						deleteItemApiUrl,
						reorderItemsApiUrl,
					);
				}
			});

			if (isLastItemNew && index === 0) {
				templateUsable.querySelector('div[action-info]').classList.add('--ok');
			}

			template.parentElement.prepend(templateUsable);
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
}

export function buildPropagandas(isLastItemNew = false) {
	const apiListBuilder = async () => await getPropagandas(token);
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

				await handleCellRequest(token, cell, form);
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
		isLastItemNew,
	);
}

export function buildCategories(isLastItemNew = false) {
	const apiListBuilder = async () => await getCategories(token);
	const sectionName = 'categories';
	const deleteItemApiUrl = '/admin/api/category';
	const reorderItemsApiUrl = '/admin/api/categories';
	const cellFunction = (apiItem, cell, index) => {
		cell.setAttribute('action', '/admin/api/categories/name');

		cell.querySelectorAll('div[pseudo-input]').forEach(async (div) => {
			div.innerText = apiItem.name;

			loadPseudoInputProperties(div);

			let lastValue = div.innerText;

			div.addEventListener('focusout', async () => {
				const currentValue = div.innerText;

				if (currentValue === lastValue) {
					return;
				}

				let form = {
					id: String(apiItem.id),
					name: div.innerText,
				};

				form = JSON.stringify(form);

				await handleCellRequest(token, cell, form, 'application/json');

				lastValue = currentValue;
			});
		});
	};

	buildComplexTable(
		apiListBuilder,
		sectionName,
		cellFunction,
		deleteItemApiUrl,
		reorderItemsApiUrl,
		isLastItemNew,
	);
}

export function buildProducts(isLastItemNew = false) {
	const apiListBuilder = async () => await getProducts(token);
	const sectionName = 'products';
	const deleteItemApiUrl = '/admin/api/product';
	const reorderItemsApiUrl = '/admin/api/products';
	const cellFunction = (apiItem, cell, index) => {
		//todo: create cellFunction for products (here)
	};

	buildComplexTable(
		apiListBuilder,
		sectionName,
		cellFunction,
		deleteItemApiUrl,
		reorderItemsApiUrl,
		isLastItemNew,
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
			token,
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
			token,
			actionContainer,
			'/admin/api/category',
			'POST',
			form,
			'application/json',
		);

		if (req) {
			template.setAttribute('original-item', '');
			buildCategories(true);
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
		console.log('make request');
	});

	actionButtons[2].addEventListener('click', () => {
		template.remove();
		handleTableVisibility();
	});

	return template;
}

//
// Others
//

function handlePseudoInputCursorAsLastProperty(div) {
	// Set the cursor position to the end of the input
	const range = document.createRange();
	const selection = window.getSelection();
	range.selectNodeContents(div);
	range.collapse(false);
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
		} else {
			lastInput = value;
		}

		handlePseudoInputCursorAsLastProperty(div);
	});

	div.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.target.blur();
			return e.preventDefault();
		}
	});
}

function loadProductInputProperties(template) {
	template.querySelectorAll('div[file-input-container]').forEach((div) => {
		const key = generateRandomString(30);

		div.querySelector('label').setAttribute('for', key);
		div.querySelector('input').setAttribute('id', key);

		loadFileInputProperties(div);
	});

	//category
	template.querySelectorAll('select').forEach(async (select) => {
		const categories = await getCategories(token);

		categories.forEach((category) => {
			const template = select.querySelector('template').content.cloneNode(true)
				.children[0];

			template.setAttribute('value', category.id);
			template.innerText = category.name;

			select.append(template);
		});
	});

	const pseudoInputs = template.querySelectorAll('div[pseudo-input]');

	pseudoInputs.forEach((div) => {
		loadPseudoInputProperties(div);
	});

	//price
	pseudoInputs[1].addEventListener('input', (event) => {
		const inputElement = event.target;
		const value = String(Number(inputElement.innerText.replace(/\D/g, '')));

		if (value.length <= 3) {
			if (value.length === 1) {
				inputElement.innerText = 'R$ 00,0' + value;
			} else if (value.length === 2) {
				inputElement.innerText = 'R$ 00,' + value;
			} else if (value.length === 3) {
				inputElement.innerText =
					'R$ ' + '0' + value.charAt(0) + ',' + value.slice(1, 3);
			}
		} else {
			// Split the value into dollars and cents
			const dollars = value.slice(0, -2);
			const cents = value.slice(-2);

			// Format the dollars with dots as thousands separators
			const formattedDollars = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

			// Concatenate the dollars and cents with a comma separator
			let formattedValue = formattedDollars + ',' + cents;

			// Add "00" to the cents if there are no cents input
			if (formattedValue === ',') {
				formattedValue += '00';
			}

			inputElement.innerText = 'R$ ' + formattedValue;
		}

		handlePseudoInputCursorAsLastProperty(inputElement);
	});

	//off
	pseudoInputs[2].addEventListener('keydown', (event) => {
		const inputElement = event.target;
		const value = String(Number(inputElement.innerText.replace(/\D/g, '')));

		if (event.key === 'Backspace') {
			inputElement.innerText = value.slice(0, -1) + '%';
		}

		handlePseudoInputCursorAsLastProperty(inputElement);
	});

	pseudoInputs[2].addEventListener('input', (event) => {
		const inputElement = event.target;
		let value = Number(inputElement.innerText.replace(/\D/g, ''));

		if (value > 100) {
			inputElement.innerText = '100%';
		} else {
			inputElement.innerText = value + '%';
		}

		handlePseudoInputCursorAsLastProperty(inputElement);
	});

	//whatsapp
	pseudoInputs[4].addEventListener('keydown', (event) => {
		const inputElement = event.target;
		let value = String(inputElement.innerText.replace(/\D/g, ''));

		if (event.key === 'Backspace') {
			if (value.length === 4) {
				inputElement.innerText = `+${value.slice(0, 2)} (${value.slice(2, 3)})`;
			}

			if (value.length === 3) {
				inputElement.innerText = value.slice(0, 3);
			}

			handlePseudoInputCursorAsLastProperty(inputElement);
		}
	});

	pseudoInputs[4].addEventListener('input', (event) => {
		handleWhatsappInputProperties(event);
	});

	function handleWhatsappInputProperties(event) {
		const inputElement = event.target;
		let value = String(inputElement.innerText.replace(/\D/g, ''));

		if (value.length === 0) {
			inputElement.innerText = '';
		} else if (value.length <= 2) {
			inputElement.innerText = `+${value}`;
		} else if (value.length === 3) {
			inputElement.innerText = `+${value.slice(0, 2)} (${value.charAt(2)})`;
		} else if (value.length <= 4) {
			inputElement.innerText = `+${value.slice(0, 2)} (${value.slice(2, 4)})`;
		} else if (value.length <= 8) {
			inputElement.innerText = `+${value.slice(0, 2)} (${value.slice(
				2,
				4,
			)}) ${value.slice(4, 8)}`;
		} else {
			inputElement.innerText = `+${value.slice(0, 2)} (${value.slice(
				2,
				4,
			)}) ${value.slice(4, 8)}-${value.slice(8, 13)}`;
		}

		handlePseudoInputCursorAsLastProperty(inputElement);
	}
}

function addSortableList(container, callBack) {
	$(function () {
		const sortable = $(`[${container}]`).sortable({
			items: 'tr:not([pseudo-item])',
			cancel: '[pseudo-item]',
			stop: callBack,
			tolerance: 'pointer',
		});

		$(`[${container}]`).on('mousedown', '[draggable]', function () {
			if (
				window.document.querySelectorAll(`[${container}] [original-item]`)
					.length < 2
			) {
				return;
			}

			sortable.sortable('enable');
		});

		$(document).on('mouseup', function (e) {
			if (
				window.document.querySelectorAll(`[${container}] [original-item]`)
					.length < 2
			) {
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

export async function handleActionRequest(
	token,
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

export async function handleCellRequest(
	token,
	cell,
	body,
	contentType = undefined,
) {
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
