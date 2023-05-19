function displayLoadingScreen() {
	const content = window.document.querySelector('div[loading-screen-container] div');

	content.querySelector('img').addEventListener('load', () => {
		content.classList.add('--on');
	});
}

function updateLoadingProgessBar(progress) {
	window.document.querySelector('div[loading-progess-bar]').style.width = progress + '%';
}

function removeLoadingScreen() {
	setTimeout(() => {
		window.document.querySelector('div[loading-screen-container]').classList.add('--off');
	}, 1400);
}

function buildLogo(header) {
	window.document.querySelectorAll('img[store-logo]').forEach((element) => {
		element.setAttribute('src', header.logo);
		element.setAttribute('alt', header.title)
	});
}

function buildHead(header) {
	window.document.querySelectorAll('meta[name="theme-color"]').forEach(element => element.setAttribute("content", header.color))
	window.document.querySelectorAll('link[rel="shortcut icon"]').forEach(element => element.setAttribute('href', header.icon))
	window.document.querySelectorAll('title').forEach(element => element.innerText = header.title)
	window.document.querySelectorAll('meta[name="description"]').forEach(element => element.setAttribute('content', header.description));
	window.document.documentElement.style.setProperty('--primary-color', header.color);
}

function buildAsideMenus(products) {
	const savedAsideMenu = document.querySelector('aside[saved-aside-menu]');
	const categoriesAsideMenu = document.querySelector('aside[categories-aside-menu]');

	const addClickHandler = (selector, element, action) => {
		document.querySelectorAll(`button[${selector}]`).forEach((button) => {
			button.addEventListener('click', () => {
				element.classList[action]('--on');
			});
		});
	};

	const asideButtonHandlers = [
		{ selector: 'open-saved-aside-menu-button', element: savedAsideMenu, action: 'add' },
		{ selector: 'close-saved-aside-menu-button', element: savedAsideMenu, action: 'remove' },
		{ selector: 'open-categories-aside-menu-button', element: categoriesAsideMenu, action: 'add' },
		{ selector: 'close-categories-aside-menu-button', element: categoriesAsideMenu, action: 'remove' },
	];

	asideButtonHandlers.forEach(({ selector, element, action }) => {
		addClickHandler(selector, element, action);
	});

	buildSavedAsideMenu(products);
	buildCategoriesAsideMenu(products);
}

function buildSearchBar(products) {
	document.querySelectorAll('div[search-container]').forEach((searchContainer) => {
		searchContainer.querySelectorAll('input').forEach((input) => {
			input.addEventListener('input', (event) => {
				searchContainer.querySelectorAll('div[search-results] button').forEach((button) => button.remove());

				const value = event.target.value
					.toLowerCase()
					.replace(/ /g, '')
					.normalize('NFD')
					.replace(/[\u0300-\u036f]/g, '');

				const templateParent = searchContainer.querySelector('div[search-results]');
				let numberOfSelectedProducts = 0;

				Object.keys(products).forEach((key, i) => {
					const productsForKey = products[key];

					productsForKey.forEach((product) => {
						const formattedProductName = product.name
							.toLowerCase()
							.replace(/ /g, '')
							.normalize('NFD')
							.replace(/[\u0300-\u036f]/g, '');

						if (!formattedProductName.includes(value)) {
							return;
						}

						numberOfSelectedProducts++;

						if (numberOfSelectedProducts > 4) {
							return;
						}

						const template = templateParent.querySelector('template').cloneNode(true).content.children[0];
						template.querySelector('img[product-image]').setAttribute('src', product.image);
						template.querySelector('img[product-image]').setAttribute('alt', product.name);
						template.querySelector('p[product-name]').innerText = product.name;

						if (product.off !== '') {
							template.querySelector('p[product-price]').innerText = convertToMoneyFormat((Number(product.price) / 100) * (100 - Number(product.off)));
						} else {
							template.querySelector('p[product-price]').innerText = convertToMoneyFormat(product.price);
						}

						template.addEventListener('click', () => {
							setTimeout(() => {
								sliderController[i] = false;

								const productSliderContainer = document.querySelectorAll('[product-slider-container]')[i];
								const productCard = document.querySelector('[product-' + product.id + ']');

								scrollTop(productCard);

								setTimeout(() => {
									scrollLeft(productSliderContainer, productCard);
								}, 1200);
							}, 120);
						});

						templateParent.append(template);
					});
				});

				if (numberOfSelectedProducts > 0) {
					searchContainer.classList.add('--on');
					input.classList.remove('--none');
				} else {
					searchContainer.classList.remove('--on');
					input.classList.add('--none');
				}
			});

			input.addEventListener('focusout', () => {
				setTimeout(() => {
					searchContainer.querySelectorAll('div[search-results] button').forEach((button) => button.remove());
					searchContainer.classList.remove('--on');
				}, 120);
			});
		});
	});
}

function buildSavedAsideMenu(products) {
	const savedIds = JSON.parse(localStorage.getItem('saved'));

	const templateParent = document.querySelector('div[saved-product-container]');
	templateParent.querySelectorAll('div').forEach((element) => {
		element.remove();
	});

	Object.keys(products).forEach((categoryKey) => {
		products[categoryKey].forEach((product) => {
			if (!savedIds.includes(product.id)) {
				return;
			}

			const template = templateParent.querySelector('template').cloneNode(true).content.children[0];

			const removeFromCartButton = template.querySelector('button[remove-from-saved-button]');
			removeFromCartButton.addEventListener('click', () => {
				template.classList.add('--off');
				template.style.height = '0px';

				setTimeout(() => {
					if ('Notification' in window) {
						if (Notification.permission === 'granted') {
							const localProducts = JSON.parse(localStorage.getItem('localProducts'));
							delete localProducts[product.id];
							localStorage.setItem('localProducts', JSON.stringify(localProducts));
						}
					}

					const updatedSavedIds = JSON.parse(localStorage.getItem('saved'));
					updatedSavedIds.splice(updatedSavedIds.indexOf(product.id), 1);
					localStorage.setItem('saved', JSON.stringify(updatedSavedIds));

					buildSavedAsideMenu(products);
				}, 350);
			});

			const productImage = template.querySelector('img[product-image]');
			productImage.setAttribute('src', product.image);
			productImage.setAttribute('alt', product.name);

			template.querySelector('p[product-name]').innerText = product.name;

			if (product.off === 0) {
				template.querySelector('p[product-price]').innerText = convertToMoneyFormat(product.price);
			} else {
				template.querySelector('p[product-old-price]').innerText = convertToMoneyFormat(product.price);
				template.querySelector('p[product-price]').innerText = convertToMoneyFormat((Number(product.price) / 100) * (100 - Number(product.off)));
			}

			template.querySelector('p[product-installment]').innerText = product.installment;
			template.querySelector('a[product-link]').setAttribute('href', '/api/product/order/' + product.id);

			templateParent.append(template);

			template.style.height = template.offsetHeight + 21 + 'px';
		});
	});
}

function buildCategoriesAsideMenu(products) {
	const templateParent = document.querySelector('ul[categories-list]');

	Object.keys(products).forEach((categoryKey, index) => {
		const template = templateParent.querySelector('template').cloneNode(true).content.children[0];

		const categoryButton = template.querySelector('button');
		categoryButton.addEventListener('click', () => {
			const productSliderContainer = document.querySelectorAll('[product-slider-container]')[index];
			scrollTop(productSliderContainer);
			document.querySelector('aside[categories-aside-menu]').classList.remove('--on');
		});

		const categoryName = template.querySelector('i[category-name]');
		categoryName.innerText = categoryKey;

		templateParent.append(template);
	});
}

function buildPropagandas(propagandas, footer) {
	const templateParent = document.querySelector('div[propagandas-container]');

	if (templateParent.children.length !== 1) {
		return;
	}

	const storeInfoParagraph = document.querySelector('p[store-info]');
	storeInfoParagraph.innerText = footer.storeInfo;

	propagandas.forEach((propaganda) => {
		const template = templateParent.querySelector('template').cloneNode(true).content.children[0];

		const bigImageSource = template.querySelector('source[big-image]');
		bigImageSource.setAttribute('srcset', propaganda.bigImage);

		const smallImage = template.querySelector('img[small-image]');
		smallImage.setAttribute('src', propaganda.smallImage);

		templateParent.append(template);
	});

	setImageSlider();
}

function buildProducts(products) {
	const productSectionContainer = document.querySelector('div[product-section-container]');

	const keys = Object.keys(products);
	let middleIndex = -1;

	if (keys.length > 2) {
		middleIndex = Math.floor(keys.length / 2);
	}

	keys.forEach((key, index) => {
		const template1 = productSectionContainer.querySelector('template').cloneNode(true).content.children[0];
		const productsContainer = template1.querySelector('[products-container]');

		if (index === middleIndex) {
			template1.classList.add('--special');
		}

		const categoryHeading = template1.querySelector('h1[category]');
		categoryHeading.innerText = key;

		products[key].forEach((product) => {
			const productTemplate = productsContainer.querySelector('template').cloneNode(true).content.children[0];
			productTemplate.setAttribute('product-' + product.id, '');

			const addToCartButton = productTemplate.querySelector('button[add-to-saved-button]');
			addToCartButton.addEventListener('click', () => {
				if ('Notification' in window) {
					if (Notification.permission === 'granted') {
						const localProducts = JSON.parse(localStorage.getItem('localProducts'));
						localProducts[product.id] = product;
						localStorage.setItem('localProducts', JSON.stringify(localProducts));
					}
				}

				const savedIds = JSON.parse(localStorage.getItem('saved'));

				if (savedIds.includes(product.id)) {
					document.querySelector('aside[saved-aside-menu]').classList.add('--on');
					return;
				}

				savedIds.push(product.id);
				localStorage.setItem('saved', JSON.stringify(savedIds));

				buildSavedAsideMenu(products);
				document.querySelector('aside[saved-aside-menu]').classList.add('--on');
			});

			const productImage = productTemplate.querySelector('img[product-image]');
			productImage.setAttribute('src', product.image);
			productImage.setAttribute('alt', product.name);

			const productName = productTemplate.querySelector('p[product-name]');
			productName.innerText = product.name;

			if (product.off === 0) {
				const productPrice = productTemplate.querySelector('p[product-price]');
				productPrice.innerText = convertToMoneyFormat(product.price);
			} else {
				const productOldPrice = productTemplate.querySelector('p[product-old-price]');
				productOldPrice.innerText = convertToMoneyFormat(product.price);

				const productPrice = productTemplate.querySelector('p[product-price]');
				productPrice.innerText = convertToMoneyFormat((Number(product.price) / 100) * (100 - Number(product.off)));
			}

			const productInstallment = productTemplate.querySelector('p[product-installment]');
			productInstallment.innerText = product.installment;

			const productLink = productTemplate.querySelector('[product-link]');
			productLink.setAttribute('href', '/api/product/order/' + product.id);

			productsContainer.append(productTemplate);
		});

		productSectionContainer.append(template1);
	});

	setProductSlider();
}

function buildFooter(footer) {
	window.document.querySelector('h1[footer-title]').innerText = footer.title;
	window.document.querySelector('p[title-text]').innerText = footer.text;
	window.document.querySelector('a[whatsapp-link]').setAttribute('href', 'https://wa.me/' + footer.whatsapp);
	window.document.querySelector('a[instagram-link]').setAttribute('href', 'https://www.instagram.com/' + footer);
	window.document.querySelector('a[facebook-link]').setAttribute('href', 'https://www.facebook.com/' + footer);
	window.document.querySelector('a[location-link]').setAttribute('href', footer.location);
	window.document.querySelector('p[complete-store-info]').innerText = footer.completeStoreInfo;
}

function clearLocalStorage(products) {
	const localStorageKey = 'saved';
	const savedItems = localStorage.getItem(localStorageKey);

	if (!savedItems) {
		localStorage.setItem(localStorageKey, '[]');
		return;
	}

	const allProductIds = [];

	Object.values(products).forEach((category) => {
		category.forEach((product) => {
			allProductIds.push(product.id);
		});
	});

	const savedIds = JSON.parse(savedItems);
	const updatedIds = savedIds.filter((id) => allProductIds.includes(id));

	localStorage.setItem(localStorageKey, JSON.stringify(updatedIds));
}

function setWindowListener() {
	const currentWidth = window.innerWidth;

	window.addEventListener('resize', () => {
		if (currentWidth !== window.innerWidth) {
			location.reload();
		}
	});
}

function handleNotifications(header, products) {
	if ('Notification' in window) {
		Notification.requestPermission().then(function (permission) {
			if (permission === 'granted') {
				handleProductsNotification(header, products);
			}
		});
	}
}

function handleProductsNotification(header, products) {
	if (!localStorage.getItem('localProducts')) {
		localStorage.setItem('localProducts', '{}');

		return;
	}

	const localProducts = JSON.parse(localStorage.getItem('localProducts'));
	let alreadyNotified = false;

	Object.keys(products).forEach((key) => {
		products[key].forEach((product) => {
			if (!localProducts[product.id]) {
				return;
			}

			if (!alreadyNotified && (Number(localProducts[product.id].price) > Number(product.price) || Number(localProducts[product.id].off) < Number(product.off))) {
				alreadyNotified = true;

				var notification = new Notification('Check out this amazing offer!', {
					body: 'You saved ' + product.name + " and now it's available at a better price! Come and check it out to take advantage of the offer.",
					icon: header.icon,
				});

				notification.onclick = () => {
					window.document.querySelector('aside[saved-aside-menu]').classList.add('--on');
				};

				localProducts[product.id] = product;
			}
		});
	});

	localStorage.setItem('localProducts', JSON.stringify(localProducts));
}

function setImageSlider() {
	const imageSliderContainer = window.document.querySelector('div[image-slider-container]');
	const imageSlider = imageSliderContainer.querySelector('div');
	const numberOfPropagandas = imageSliderContainer.querySelectorAll('img[small-image]').length;
	let currentIndex = 0;
	let goingLeft = true;
	let isMoving = false;

	setInterval(() => {
		if (isMoving) {
			isMoving = false;
			return;
		}

		if (goingLeft) {
			$(true);
		} else {
			$(false);
		}
	}, 7000);

	const event = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'touchstart' : 'mousedown';

	imageSliderContainer.querySelector('button:first-of-type').addEventListener(event, () => $(false));
	imageSliderContainer.querySelector('button:last-of-type').addEventListener(event, () => $(true));

	function $(forward) {
		isMoving = true;

		forward ? currentIndex++ : currentIndex--;

		imageSlider.scrollTo({
			left: (imageSlider.scrollWidth / numberOfPropagandas) * currentIndex,
			top: 0,
			behavior: 'smooth',
		});

		if (currentIndex + 1 >= numberOfPropagandas) {
			currentIndex = numberOfPropagandas - 1;
			goingLeft = false;
		}

		if (currentIndex <= 0) {
			currentIndex = 0;
			goingLeft = true;
		}
	}
}

const sliderController = [];

function setProductSlider() {
	window.document.querySelectorAll('div[product-slider-container]').forEach((element, index) => {
		sliderController.push(true);
		let isDown = false;
		let startX;
		let position;
		let left;
		let scrollLeft;
		let sliderControllerSetted = false;

		setInterval(() => {
			if (element.scrollWidth - element.clientWidth < 220 && !element.classList.contains('--special')) {
				element.classList.add('--special');
			}

			if (isDown) {
				sliderController[index] = false;
			}

			if (sliderController[index]) {
				if (sliderControllerSetted) {
					sliderControllerSetted = false;
				}
				if (position >= element.scrollWidth - element.clientWidth) left = false;
				if (position <= 1) left = true;

				if (left) position = element.scrollLeft + 1;
				else position = element.scrollLeft - 1;

				element.scrollTo(position, 0);
			}

			if (!sliderController[index] && !sliderControllerSetted) {
				sliderControllerSetted = true;

				setTimeout(() => {
					sliderController[index] = true;
				}, 7000);
			}
		}, 14);

		element.addEventListener('touchmove', () => {
			isDown = true;
		});
		element.addEventListener('touchend', () => {
			isDown = false;
		});
		element.addEventListener('mousedown', (e) => {
			isDown = true;
			element.classList.add('active');
			startX = e.pageX - element.offsetLeft;
			scrollLeft = element.scrollLeft;
		});
		element.addEventListener('mouseleave', () => {
			isDown = false;
			element.classList.remove('active');
		});
		element.addEventListener('mouseup', () => {
			isDown = false;
			element.classList.remove('active');
		});
		element.addEventListener('mousemove', (e) => {
			if (!isDown) return;
			e.preventDefault();
			const x = e.pageX - element.offsetLeft;
			const walk = x - startX;
			element.scrollLeft = scrollLeft - walk;
			position = element.scrollLeft;
		});
	});

	window.addEventListener('resize', () => {
		window.document.querySelectorAll('div[product-slider-container]').forEach((element) => {
			element.classList.remove('--special');

			if (element.scrollWidth - element.clientWidth < 200) {
				element.classList.add('--special');
			}
		});
	});
}

function convertToMoneyFormat(number) {
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function scrollTop(element) {
	window.scrollTo({
		left: 0,
		top: getOffset(element).top - (window.innerWidth >= 700 ? window.innerHeight / 6 : window.innerHeight / 3.5),
		behavior: 'smooth',
	});

	function getOffset(element) {
		return {
			left: element.getBoundingClientRect().left + window.scrollX,
			top: element.getBoundingClientRect().top + window.scrollY,
		};
	}
}

function scrollLeft(container, element) {
	container.scrollTo({
		left: element.getBoundingClientRect().left + container.scrollLeft - (window.innerWidth >= 700 ? 294 : 42),
		top: 0,
		behavior: 'smooth',
	});
}
