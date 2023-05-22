/**
 * Displays a loading screen by adding the CSS class '--on' to the loading screen container element
 * when the image inside it has finished loading.
 */
function displayLoadingScreen() {
	const container = window.document.querySelector('div[loading-screen-container] div');
	const img = container.querySelector('img');

	img.addEventListener('load', () => {
		container.classList.add('--on');
	});
}

/**
 * Sets up the image load event listeners and handles the loading progress.
 * When an image is loaded, it updates the loading progress bar based on the number of loaded images.
 * If all images are loaded, it removes the loading screen and triggers notifications after a delay.
 */
function setImagesListener() {
	const images = window.document.querySelectorAll('img');
	let loadedCount = 0;

	images.forEach(function (image) {
		image.addEventListener('load', function () {
			loadedCount++;
			const progress = (loadedCount / images.length) * 100;
			window.document.querySelector('div[loading-progress-bar]').style.width = progress + '%';

			if (loadedCount === images.length) {
				setTimeout(() => {
					window.document.querySelector('div[loading-screen-container]').classList.add('--off');
				}, 1400);
			}
		});
	});
}

/**
 * Builds the search bar functionality using the provided products data.
 *
 * @param {Object} products - The products data used for search functionality.
 */
function buildSearchBar(products) {
	const formatString = (str) =>
		str
			.toLowerCase()
			.replace(/ /g, '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');

	document.querySelectorAll('div[search-container]').forEach((searchContainer) => {
		const input = searchContainer.querySelector('input');
		const templateParent = searchContainer.querySelector('div[search-results]');

		input.addEventListener('input', (event) => {
			const value = formatString(event.target.value);
			const template = templateParent.querySelector('template');
			let numberOfSelectedProducts = 0;

			templateParent.querySelectorAll('button').forEach((element) => {
				element.remove();
			});

			Object.values(products).forEach((productsForKey, i) => {
				productsForKey.forEach((product) => {
					const formattedProductName = formatString(product.name);

					if (!formattedProductName.includes(value)) {
						return;
					}

					numberOfSelectedProducts++;

					if (numberOfSelectedProducts > 4) {
						return;
					}

					const clone = template.cloneNode(true).content.children[0];
					const templateImg = clone.querySelector('img[product-image]');
					const templateName = clone.querySelector('p[product-name]');
					const templatePrice = clone.querySelector('p[product-price]');

					templateImg.src = product.image;
					templateImg.alt = product.name;
					templateName.innerText = product.name;

					if (product.off !== '') {
						templatePrice.innerText = convertToMoneyFormat((Number(product.price) / 100) * (100 - Number(product.off)));
					} else {
						templatePrice.innerText = convertToMoneyFormat(product.price);
					}

					clone.addEventListener('mousedown', () => {
						setTimeout(() => {
							sliderController[i] = false;

							const productSliderContainer = document.querySelectorAll('[product-slider-container]')[i];
							const productCard = document.querySelector(`[product-${product.id}]`);

							scrollTop(productCard);

							setTimeout(() => {
								scrollLeft(productSliderContainer, productCard);
							}, 1200);
						}, 120);
					});

					templateParent.appendChild(clone);
				});
			});

			searchContainer.classList.toggle('--on', numberOfSelectedProducts > 0);
			input.classList.toggle('--none', numberOfSelectedProducts === 0);
		});

		input.addEventListener('focusout', () => {
			setTimeout(() => {
				templateParent.querySelectorAll('button').forEach((element) => {
					element.remove();
				});

				searchContainer.classList.remove('--on');
			}, 120);
		});
	});
}

/**
 * Builds the saved aside menu using the provided products data.
 *
 * @param {Object} products - The products data used for building the menu.
 */
function buildSavedAsideMenu(products) {
	const savedIds = JSON.parse(localStorage.getItem('saved'));
	const templateParent = document.querySelector('div[saved-product-container]');

	templateParent.querySelectorAll('div').forEach((element) => {
		element.remove();
	});

	Object.values(products).forEach((productsForKey) => {
		productsForKey.forEach((product) => {
			if (!savedIds.includes(product.id)) {
				return;
			}

			const template = templateParent.querySelector('template').content.firstElementChild.cloneNode(true);
			const removeFromCartButton = template.querySelector('button[remove-from-saved-button]');
			const productImage = template.querySelector('img[product-image]');
			const productName = template.querySelector('p[product-name]');
			const productPrice = template.querySelector('p[product-price]');
			const productInstallment = template.querySelector('p[product-installment]');
			const productLink = template.querySelector('a[product-link]');

			removeFromCartButton.addEventListener('click', () => {
				template.classList.add('--off');
				template.style.height = '0px';

				setTimeout(() => {
					if ('Notification' in window && Notification.permission === 'granted') {
						const localProducts = JSON.parse(localStorage.getItem('localProducts'));
						delete localProducts[product.id];
						localStorage.setItem('localProducts', JSON.stringify(localProducts));
					}

					const updatedSavedIds = JSON.parse(localStorage.getItem('saved'));
					updatedSavedIds.splice(updatedSavedIds.indexOf(product.id), 1);
					localStorage.setItem('saved', JSON.stringify(updatedSavedIds));

					buildSavedAsideMenu(products);
				}, 350);
			});

			productImage.src = product.image;
			productImage.alt = product.name;
			productName.textContent = product.name;

			if (product.off === 0) {
				productPrice.textContent = convertToMoneyFormat(product.price);
			} else {
				productPrice.textContent = convertToMoneyFormat((Number(product.price) / 100) * (100 - Number(product.off)));
				const oldPriceElement = template.querySelector('p[product-old-price]');
				oldPriceElement.textContent = convertToMoneyFormat(product.price);
			}

			productInstallment.textContent = product.installment;
			productLink.href = '/api/product/order/' + product.id;

			templateParent.appendChild(template);
			template.style.height = template.offsetHeight + 21 + 'px';
		});
	});
}

/**
 * Builds the categories aside menu using the provided products data.
 * @param {Object} products - The products data.
 */
function buildCategoriesAsideMenu(products) {
	const templateParent = document.querySelector('ul[categories-list]');

	Object.keys(products).forEach((categoryKey, index) => {
		const template = templateParent.querySelector('template').cloneNode(true);
		const categoryButton = template.content.children[0];
		const categoryName = categoryButton.querySelector('i[category-name]');
		categoryName.innerText = categoryKey;

		categoryButton.addEventListener('click', () => {
			setTimeout(() => {
				const productSliderContainer = document.querySelectorAll('[product-slider-container]')[index];
				scrollTop(productSliderContainer);
			}, 120);
		});

		templateParent.appendChild(categoryButton);
	});
}

/**
 * Builds the propagandas using the provided data and updates the footer information.
 * @param {Array} propagandas - The array of propaganda data.
 * @param {Object} footer - The footer data.
 */
function buildPropagandas(propagandas, footer) {
	const templateParent = document.querySelector('div[propagandas-container]');

	if (templateParent.children.length !== 1) {
		return;
	}

	const storeInfoParagraph = document.querySelector('p[store-info]');
	storeInfoParagraph.textContent = footer.storeInfo;

	propagandas.forEach((propaganda) => {
		const template = templateParent.querySelector('template');
		const clonedTemplate = template.content.cloneNode(true);
		const bigImageSource = clonedTemplate.querySelector('source[big-image]');
		const smallImage = clonedTemplate.querySelector('img[small-image]');

		bigImageSource.srcset = propaganda.bigImage;
		smallImage.src = propaganda.smallImage;

		templateParent.appendChild(clonedTemplate);
	});

	setImageSlider();
}

/**
 * Build the products section based on the provided products data.
 * @param {Object} products - The products data.
 */
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

/**
 * Build the footer section based on the provided footer data.
 * @param {Object} footer - The footer data.
 */
function buildFooter(footer) {
	const document = window.document;

	document.querySelector('h1[footer-title]').innerText = footer.title;
	document.querySelector('p[title-text]').innerText = footer.text;
	document.querySelector('a[whatsapp-link]').setAttribute('href', 'https://wa.me/' + footer.whatsapp);
	document.querySelector('a[instagram-link]').setAttribute('href', 'https://www.instagram.com/' + footer.instagram.replace('@', ''));
	document.querySelector('a[facebook-link]').setAttribute('href', 'https://www.facebook.com/' + footer.facebook.replace('@', ''));
	document.querySelector('a[location-link]').setAttribute('href', footer.location);
	document.querySelector('p[complete-store-info]').innerText = footer.completeStoreInfo;
}

/**
 * Clear the local storage by filtering out saved item IDs that are no longer present in the products data.
 * @param {Object} products - The products data.
 */
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

/**
 * Handles notifications by requesting permission and calling the function to handle product notifications.
 * @param {Object} header - The header data.
 * @param {Object} products - The products data.
 */
function handleNotifications(header, products) {
	if ('Notification' in window) {
		Notification.requestPermission().then(function (permission) {
			if (permission === 'granted') {
				handleProductsNotification(header, products);
			}
		});
	}
}

/**
 * Handles product notifications by checking for price and discount changes and displaying a notification if applicable.
 * @param {Object} header - The header data.
 * @param {Object} products - The products data.
 */
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

/**
 * Sets up the image slider functionality.
 */
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
			if (index == 2) {
				console.log();
			}

			if (element.scrollWidth - element.clientWidth < Number(window.getComputedStyle(element).paddingLeft.replace('px', '')) + 280 && !element.classList.contains('--special')) {
				element.classList.add('--special');

				if (element.children.length % 2 === 0) {
					element.style.gridTemplateColumns = 'auto auto auto';

					if (element.children.length > 4) {
						element.children[element.children.length - 1].classList.add('--special');
					}
				}
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

				if (element.scrollWidth - element.clientWidth > 100) {
					if (left) position = element.scrollLeft + 1;
					else position = element.scrollLeft - 1;
				}

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

				if (element.children.length % 2 === 0) {
					element.style.gridTemplateColumns = 'auto auto auto';

					if (element.children.length > 4) {
						element.children[element.children.length - 1].classList.add('--special');
					}
				}
			}
		});
	});
}

/**
 * Converts a number to a money format with currency symbol.
 * @param {number} number - The number to convert.
 * @returns {string} The formatted money string.
 */
function convertToMoneyFormat(number) {
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/**
 * Scrolls the window to the specified element's position.
 * @param {HTMLElement} element - The target element.
 */
function scrollTop(element) {
	window.scrollTo({
		left: 0,
		top: getOffset(element).top - (window.innerWidth >= 700 ? 180 : 220),
		behavior: 'smooth',
	});

	function getOffset(element) {
		return {
			left: element.getBoundingClientRect().left + window.scrollX,
			top: element.getBoundingClientRect().top + window.scrollY,
		};
	}
}

/**
 * Scrolls the specified container to the left until the element is in view.
 * @param {HTMLElement} container - The container element to scroll.
 * @param {HTMLElement} element - The target element to bring into view.
 */
function scrollLeft(container, element) {
	container.scrollTo({
		left: element.getBoundingClientRect().left + container.scrollLeft - (window.innerWidth >= 700 ? 294 : 42),
		top: 0,
		behavior: 'smooth',
	});
}
