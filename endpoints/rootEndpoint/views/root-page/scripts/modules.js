/**
 * Function to handle loading images and update the loading progress.
 * @param {HTMLElement} loadingScreenContainer - The container element for the loading screen.
 */
export function handleLoadingImages(loadingScreenContainer) {
	const allImages = window.document.querySelectorAll('img');
	let loadedImages = 0;
	let timeOut = false;

	allImages.forEach((img) => {
		if (img.complete) {
			loadedImages++;
			$();
			return;
		}

		img.addEventListener('load', () => {
			loadedImages++;
			$();
		});
	});

	setTimeout(() => {
		$(true);
	}, 10000);

	function $(remove = false) {
		if (timeOut) {
			return;
		}

		if (allImages.length === loadedImages || remove) {
			timeOut = true;

			setTimeout(() => {
				loadingScreenContainer.parentElement.classList.add('--off');
				handlePopUp();
			}, 500);
		}
	}
}

/**
 * Handles the pop-up functionality.
 * If the pop-up has an image, it triggers a pop-up animation when called.
 * Clicking on the background or the "a" element in the pop-up will close the pop-up.
 */
function handlePopUp() {
	const popUp = builder['pop-up'];

	if (!popUp.image) {
		return;
	}

	const show = localStorage.getItem('popUp');

	if (!show || show === 'false') {
		localStorage.setItem('popUp', 'true');
	} else {
		localStorage.setItem('popUp', 'false');
		return;
	}

	const container = window.document.querySelector('div[pop-up-container]');

	setTimeout(() => {
		container.classList.add('--on');

		setTimeout(() => {
			let go = true;

			container
				.querySelector('div[pop-up-image-container]')
				.addEventListener('click', () => {
					go = false;
				});

			const closePopUp = () => {
				if (!go) {
					go = true;
					return;
				}

				container.classList.remove('--on');
				container.classList.add('--off');

				setTimeout(() => {
					container.classList.remove('--off');
				}, 1000);
			};

			container.addEventListener('click', () => closePopUp());
			container
				.querySelector('button')
				.addEventListener('click', () => closePopUp());
		}, 400);
	}, 1500);
}

/**
 * Loads product image properties for the image element with animation effect.
 * This function is responsible for animating the image swapping effect for a single image.
 * It swaps the 'src' attribute with the 'plus-src' attribute, creating a fade-in and fade-out
 * transition effect between two images. The image will appear to change every 7 seconds (7000ms)
 * while transitioning between the two images.
 * @param {HTMLElement} img - The image element to apply the image swapping effect.
 */
export function loadProductImageProperties(img) {
	let src = img.getAttribute('src');
	let plusSrc = img.getAttribute('plus-src');
	let temp;

	const preloadImage = (url) => {
		const img = new Image();
		img.src = url;
	};

	preloadImage(src);
	preloadImage(plusSrc);

	const createInterval = () =>
		setInterval(() => {
			changeImage();
		}, Math.floor(Math.random() * (41000 - 17500 + 1)) + 17500);

	const changeImage = () => {
		img.style.filter = 'opacity(0%)';

		setTimeout(() => {
			img.setAttribute('src', plusSrc);
			img.setAttribute('plus-src', src);

			temp = src;
			src = plusSrc;
			plusSrc = temp;

			setTimeout(() => {
				img.style.filter = 'opacity(100%)';
			}, 250);
		}, 250);
	};

	let interval = createInterval();

	if (
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		)
	) {
		let setAgain;

		img.addEventListener('click', () => {
			changeImage();

			clearInterval(interval);

			if (setAgain) {
				clearTimeout(setAgain);
			}

			setAgain = setTimeout(() => {
				interval = createInterval();
			}, 10000);
		});
	} else {
		img.addEventListener('mouseenter', () => {
			clearInterval(interval);

			changeImage();
		});

		img.addEventListener('mouseleave', () => {
			interval = createInterval();

			changeImage();
		});
	}
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
 * Function to render saved products on the page.
 * @param {Object} products - An object containing the saved products.
 */
export function renderSavedProducts(products) {
	let saved = localStorage.getItem('saved');

	if (!saved) {
		localStorage.setItem('saved', '[]');
		saved = localStorage.getItem('saved');
	}

	const savedIds = JSON.parse(saved);
	const templateParent = document.querySelector('div[saved-product-container]');

	templateParent.querySelectorAll('div').forEach((element) => {
		element.remove();
	});

	Object.values(products).forEach((productsForKey) => {
		productsForKey.forEach((product) => {
			if (!savedIds.includes(String(product.id))) {
				return;
			}

			const template = templateParent
				.querySelector('template')
				.content.firstElementChild.cloneNode(true);
			const removeFromCartButton = template.querySelector(
				'button[remove-from-saved-button]',
			);
			const productImage = template.querySelector('img[product-image]');
			const productName = template.querySelector('p[product-name]');
			const productPrice = template.querySelector('p[product-price]');
			const productDescription = template.querySelector(
				'p[product-description]',
			);
			const productLink = template.querySelector('a[product-link]');

			removeFromCartButton.addEventListener('click', () => {
				template.classList.add('--off');
				template.style.height = '0px';

				setTimeout(() => {
					const updatedSavedIds = JSON.parse(localStorage.getItem('saved'));
					updatedSavedIds.splice(updatedSavedIds.indexOf(product.id), 1);
					localStorage.setItem('saved', JSON.stringify(updatedSavedIds));
				}, 350);
			});

			productImage.src = product.image;

			productImage.alt = product.name;
			productName.textContent = product.name;

			if (product.off === 0) {
				productPrice.textContent = convertToMoneyFormat(product.price);
			} else {
				productPrice.textContent = convertToMoneyFormat(
					(Number(product.price) / 100) * (100 - Number(product.off)),
				);
				const oldPriceElement = template.querySelector('p[product-old-price]');
				oldPriceElement.textContent = convertToMoneyFormat(product.price);
			}

			productDescription.textContent = product.description;
			productLink.href = `/api/order/${product.id}`;

			templateParent.append(template);
			template.style.height = `${template.offsetHeight + 21}px`;
		});
	});
}

/**
 * Function to handle the products grid layout and add special styling if needed.
 * @param {HTMLElement} element - The container element for the products grid.
 */
export function handleProductsGrid(element) {
	const minWidth = Number(
		window.getComputedStyle(element.children[0]).minWidth.replace('px', ''),
	);

	const paddingLeft = Number(
		window.getComputedStyle(element).paddingLeft.replace('px', ''),
	);

	if (
		element.scrollWidth - element.clientWidth < paddingLeft + minWidth &&
		!element.classList.contains('--special')
	) {
		element.classList.add('--special');

		if (element.children.length === 1) {
			return;
		}

		if (
			element.clientWidth - paddingLeft * 2.5 <
				minWidth * element.children.length &&
			element.children.length <= 3
		) {
			element.style.gridTemplateColumns = '1fr';

			return;
		}

		if (element.children.length % 2 !== 0) {
			element.style.gridTemplateColumns = '1fr 1fr 1fr';

			if (element.children.length > 4) {
				element.children[element.children.length - 1].classList.add(
					'--special',
				);
			}
		} else {
			if (
				(element.offsetWidth - paddingLeft * 2) / 3 > minWidth &&
				element.children.length % 3 === 0
			) {
				element.style.gridTemplateColumns = '1fr 1fr 1fr';

				return;
			}

			element.style.gridTemplateColumns = '1fr 1fr';
		}
	}
}

/**
 * Function to handle the scrolling of propaganda images in a slider.
 * @param {Object} controller - The controller object containing the slider information.
 * @param {boolean} forward - A flag indicating the scroll direction (true for forward, false for backward).
 * @param {boolean} ignoreIsMoving - Optional. A flag indicating whether to ignore the 'isMoving' property of the controller. Default is false.
 */
export function handlePropagandaScroll(
	controller,
	forward,
	ignoreIsMoving = false,
) {
	if (controller.isMoving && !ignoreIsMoving) {
		return;
	}

	forward ? controller.currentIndex++ : controller.currentIndex--;

	controller.imageSlider.scrollTo({
		left:
			(controller.imageSlider.scrollWidth / controller.numberOfPropagandas) *
			controller.currentIndex,
		top: 0,
		behavior: 'smooth',
	});

	const container = controller.imageSliderContainer.querySelectorAll('button');
	const firstButton = container[0];
	const lastButton = container[1];

	firstButton.classList.remove('--off');
	lastButton.classList.remove('--off');

	if (controller.currentIndex + 1 >= controller.numberOfPropagandas) {
		controller.currentIndex = controller.numberOfPropagandas - 1;
		controller.goingLeft = false;

		lastButton.classList.add('--off');
	}

	if (controller.currentIndex <= 0) {
		controller.currentIndex = 0;
		controller.goingLeft = true;

		firstButton.classList.add('--off');
	}
}

/**
 * Function to handle the search functionality.
 * @param {HTMLElement} searchContainer - The search container element.
 * @param {HTMLElement} input - The input element for search.
 * @param {HTMLElement} templateParent - The parent element for the search result templates.
 * @param {Object} products - An object containing the products data.
 * @param {Event} event - The search event object.
 * @param {Object} sliderController - The controller object for the sliders.
 */
export function handleSearchBar(
	searchContainer,
	input,
	templateParent,
	products,
	event,
	sliderController,
) {
	const formatString = (str) =>
		str
			.toLowerCase()
			.replace(/ /g, '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '');

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

			if (numberOfSelectedProducts > 3) {
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
				templatePrice.innerText = convertToMoneyFormat(
					(Number(product.price) / 100) * (100 - Number(product.off)),
				);
			} else {
				templatePrice.innerText = convertToMoneyFormat(product.price);
			}

			clone.addEventListener('mousedown', () => {
				setTimeout(() => {
					sliderController[i] = false;

					const productSliderContainer = document.querySelectorAll(
						'[product-slider-container]',
					)[i];
					const productCard = document.querySelector(
						`[product-id="${product.id}"]`,
					);

					window.scrollTo({
						top:
							productCard.getBoundingClientRect().top +
							window.scrollY -
							window.innerHeight / 2 +
							productCard.offsetHeight / 2 +
							-80,
						behavior: 'smooth',
					});

					setTimeout(() => {
						productSliderContainer.scrollTo({
							left:
								productCard.getBoundingClientRect().left +
								productSliderContainer.scrollLeft -
								window.innerWidth / 2 +
								productCard.offsetWidth / 2,
							behavior: 'smooth',
						});
					}, 2000);
				}, 120);
			});

			templateParent.appendChild(clone);
		});
	});

	searchContainer.classList.toggle('--on', numberOfSelectedProducts > 0);
	input.classList.toggle('--none', numberOfSelectedProducts === 0);
}

/**
 * Function to convert a number to money format.
 * @param {number} number - The number to be converted.
 * @returns {string} - The number in money format.
 */
export function convertToMoneyFormat(number) {
	return number.toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});
}
