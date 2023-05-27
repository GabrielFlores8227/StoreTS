buildLogo(builder.header);
displayLoadingScreen();

clearLocalStorage(builder.products);
buildHead(builder.header);
buildSavedAsideMenu(builder.products);
buildCategoriesAsideMenu(builder.products);
buildAsideMenus([
	{
		selector: 'open-saved-aside-menu-button',
		element: document.querySelector('aside[saved-aside-menu]'),
		action: 'add',
	},
	{
		selector: 'close-saved-aside-menu-button',
		element: document.querySelector('aside[saved-aside-menu]'),
		action: 'remove',
	},
	{
		selector: 'open-categories-aside-menu-button',
		element: document.querySelector('aside[categories-aside-menu]'),
		action: 'add',
	},
	{
		selector: 'close-categories-aside-menu-button',
		element: document.querySelector('aside[categories-aside-menu]'),
		action: 'remove',
	},
]);

buildSearchBar(builder.products);
buildPropagandas(builder.propagandas, builder.footer);
buildProducts(builder.products);
buildFooter(builder.footer);

setImagesListener();
