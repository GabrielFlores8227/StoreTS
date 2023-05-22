(async () => {
	const header = await (await fetch('/api/header')).json();

	buildLogo(header);
	displayLoadingScreen();

	const propagandas = await (await fetch('/api/propagandas')).json();
	const products = await (await fetch('/api/products')).json();
	const footer = await (await fetch('/api/footer')).json();

	clearLocalStorage(products);
	buildHead(header);
	buildSavedAsideMenu(products);
	buildCategoriesAsideMenu(products);
	buildAsideMenus([
		{ selector: 'open-saved-aside-menu-button', element: document.querySelector('aside[saved-aside-menu]'), action: 'add' },
		{ selector: 'close-saved-aside-menu-button', element: document.querySelector('aside[saved-aside-menu]'), action: 'remove' },
		{ selector: 'open-categories-aside-menu-button', element: document.querySelector('aside[categories-aside-menu]'), action: 'add' },
		{ selector: 'close-categories-aside-menu-button', element: document.querySelector('aside[categories-aside-menu]'), action: 'remove' },
	]);
	buildSearchBar(products);
	buildPropagandas(propagandas, footer);
	buildProducts(products);
	buildFooter(footer);
	setImagesListener();
	setTimeout(() => {
		handleNotifications(header, products);
	}, 7000);
})();
