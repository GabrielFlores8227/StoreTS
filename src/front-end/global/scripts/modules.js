// This function updates the title of the page by appending the text ' | Admin' to the existing title.
// It retrieves the title element from the DOM using a query selector and modifies its inner text by appending the additional text.
function setAdminTitle() {
	const title = window.document.querySelector('title');

	title.innerText = title.innerText + ' | Admin';
}

// This function updates the logo elements in the header with the provided logo and title.
// It selects all image elements with the attribute 'store-logo' and sets their 'src' attribute to the logo URL
// and 'alt' attribute to the header title.
function buildLogo(header) {
	window.document.querySelectorAll('img[store-logo]').forEach((element) => {
		element.setAttribute('src', header.logo);
		element.setAttribute('alt', header.title);
	});
}

// This function updates various elements in the header with the provided header data.
// It selects specific elements in the DOM using query selectors and updates their attributes or inner text
// based on the corresponding properties in the header object.
// It also sets the primary color of the page by updating the CSS variable '--primary-color' in the root element.
function buildHead(header) {
	window.document.querySelectorAll('meta[name="theme-color"]').forEach((element) => element.setAttribute('content', header.color));
	window.document.querySelectorAll('link[rel="shortcut icon"]').forEach((element) => element.setAttribute('href', header.icon));
	window.document.querySelectorAll('title').forEach((element) => (element.innerText = header.title));
	window.document.querySelectorAll('meta[name="description"]').forEach((element) => element.setAttribute('content', header.description));
	window.document.documentElement.style.setProperty('--primary-color', header.color);
}

/**
 * Builds the aside menus using the provided button handlers.
 *
 * @param {Array} asideButtonHandler - The array of button handlers used to build the aside menus.
 */
function buildAsideMenus(asideButtonHandler) {
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
