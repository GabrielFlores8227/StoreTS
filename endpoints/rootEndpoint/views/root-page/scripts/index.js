import {
	handleLoadingImages,
	buildAsideMenus,
	renderSavedProducts,
	handleProductsGrid,
	handleSearchBar,
	handlePropagandaScroll,
	convertToMoneyFormat,
	loadProductImageProperties,
} from './modules.js';

/**
 * Loading Screen Functionality
 *
 * This self-invoking function sets up the loading screen functionality.
 * It selects the loading screen container element from the window document,
 * along with its logo image element. It adds a load event listener to the logo image,
 * and when the logo finishes loading, it adds the "--on" class to the loading screen container
 * to display the loading screen. If the logo is already complete (cached), the "--on" class is immediately added.
 * After a delay of 2000 milliseconds (2 seconds), it calls the "handleLoadingImages" function,
 * passing the loading screen container as an argument, to handle any additional loading images.
 * This function helps create a smooth loading experience for the user.
 */
(() => {
	const loadingScreenContainer = window.document.querySelector(
		'div[loading-screen]',
	);

	const logo = loadingScreenContainer.querySelector('img');

	logo.addEventListener('load', () => {
		loadingScreenContainer.classList.add('--on');
	});

	if (logo.complete) {
		loadingScreenContainer.classList.add('--on');
	}

	setTimeout(() => {
		handleLoadingImages(loadingScreenContainer);
	}, 2000);
})();

/**
 * Load Product Images with Custom Attribute 'plus-src'
 *
 * This block of code is responsible for loading product images on a web page.
 * It selects all <img> elements in the DOM that have a custom attribute called 'plus-src'
 * and loads the properties related to product images for each of these elements.
 * The 'loadProductImageProperties' function is called to handle loading image properties.
 *
 * - The code uses an immediately invoked function expression (IIFE) to execute the script immediately after it is defined.
 * - The 'querySelectorAll' method selects all <img> elements with the 'plus-src' attribute.
 * - The 'forEach' method iterates through each selected <img> element.
 * - The 'loadProductImageProperties' function is called for each <img> element to handle loading its properties.
 */
(() => {
	window.document.querySelectorAll('img[plus-src]').forEach((img) => {
		loadProductImageProperties(img);
	});
})();

/**
 * Slider Functionality for Multiple Product Sliders
 *
 * This block of code initializes and controls the functionality of multiple product sliders on a web page.
 * It iterates over each slider element, sets up event listeners for touch and mouse interactions,
 * and handles continuous scrolling of the sliders when not being interacted with.
 * The code also includes a resize event listener to handle resizing of the window.
 * The 'handleProductsGrid' function is called to handle the products grid for each slider element.
 *
 * - The 'sliders' variable stores all elements with the attribute 'product-slider-container'.
 * - The 'searchSliderController' array and 'touchSliderController' array is used to track the state of each slider.
 * - Variables like 'isDown', 'startX', 'position', 'left', and 'scrollLeft' keep track of slider state and position.
 * - Event listeners are added to handle touch and mouse events, including movement, click, and release.
 * - An interval is set up to continuously scroll the sliders when not being interacted with.
 * - The 'handleProductsGrid' function is called to handle the products grid layout within each slider.
 * - A resize event listener is added to handle window resizing, applying necessary actions to the sliders.
 */
const searchSliderController = [];
const touchSliderController = [];

(() => {
	const sliders = window.document.querySelectorAll(
		'div[product-slider-container]',
	);
	const wait = 5000;

	sliders.forEach((element, index) => {
		handleProductsGrid(element);

		searchSliderController.push(true);
		touchSliderController.push(true);

		let isDown = false;
		let startX;
		let scrollLeft;
		element.scrollLeft =
			index % 2 === 0 ? 0 : element.scrollWidth - element.clientWidth;
		let startAgain;
		let left = false;

		element.addEventListener('touchmove', () => {
			isDown = true;

			touchSliderController[index] = false;
		});

		element.addEventListener('touchend', () => {
			isDown = false;

			searchSliderController[index] = true;

			if (startAgain) {
				clearTimeout(startAgain);
			}

			startAgain = setTimeout(() => {
				touchSliderController[index] = true;
			}, wait);
		});

		element.addEventListener('mousedown', (e) => {
			isDown = true;
			element.classList.add('active');
			startX = e.pageX - element.offsetLeft;
			scrollLeft = element.scrollLeft;

			touchSliderController[index] = false;
		});

		element.addEventListener('mouseleave', () => {
			isDown = false;
			element.classList.remove('active');

			searchSliderController[index] = true;

			if (startAgain) {
				clearTimeout(startAgain);
			}

			startAgain = setTimeout(() => {
				touchSliderController[index] = true;
			}, wait);
		});

		element.addEventListener('mouseup', () => {
			isDown = false;
			element.classList.remove('active');

			searchSliderController[index] = true;

			if (startAgain) {
				clearTimeout(startAgain);
			}

			startAgain = setTimeout(() => {
				touchSliderController[index] = true;
			}, wait);
		});

		element.addEventListener('mousemove', (e) => {
			if (!isDown) return;
			e.preventDefault();
			const x = e.pageX - element.offsetLeft;
			const walk = x - startX;
			element.scrollLeft = scrollLeft - walk;
		});

		setInterval(() => {
			if (
				window.innerWidth < 320 ||
				!(element.scrollWidth > element.clientWidth)
			) {
				return;
			}

			if (
				isDown ||
				!touchSliderController[index] ||
				!searchSliderController[index]
			) {
				return;
			}

			const children = Array.from(element.children);

			const containerMiddle = element.scrollLeft + element.offsetWidth / 2;

			let closestElement = null;
			let closestDistance = Infinity;
			let closestIndex = -1;

			for (let i = 0; i < children.length; i++) {
				const child = children[i];

				const childMiddle = child.offsetLeft + child.offsetWidth / 2;

				const distance = Math.abs(containerMiddle - childMiddle);

				if (distance < closestDistance) {
					closestElement = child;
					closestDistance = distance;
					closestIndex = i;
				}
			}

			if (element.scrollLeft === 0) {
				left = false;
			}

			if (
				element.scrollWidth - element.clientWidth <=
				Math.ceil(element.scrollLeft)
			) {
				left = true;
			}

			const child = left
				? children[closestIndex - 1]
				: children[closestIndex + 1];

			element.scrollTo({
				left:
					child.getBoundingClientRect().left +
					element.scrollLeft -
					window.innerWidth / 2 +
					child.offsetWidth / 2,
				behavior: 'smooth',
			});
		}, 3000);

		window.addEventListener('resize', () => {
			touchSliderController[index] = false;
			touchSliderController[index] = true;

			element.classList.remove('--special');
			handleProductsGrid(element);
		});
	});
})();

/**
 * Search Functionality for Search Containers
 *
 * This block of code sets up search functionality for multiple search containers on a web page.
 * It selects all elements with the attribute 'search-container' and iterates over each search container.
 * For each search container, it attaches event listeners to the input field for handling search functionality.
 * The 'handleSearchBar' function is called to perform the search and update the search results.
 *
 * - The 'products' variable is destructured from the 'builder' object.
 * - The code selects all elements with the attribute 'search-container' and iterates over them.
 * - Event listeners are added to the input field for 'input', 'focus', and 'focusout' events.
 * - When the input value changes or the input field gains focus, the 'handleSearchBar' function is called.
 * - The 'handleSearchBar' function is provided with the necessary parameters for performing the search.
 * - When the input field loses focus, a timeout is set to remove search results and reset the search container after 120 milliseconds.
 */
(() => {
	const { products } = builder;

	window.document
		.querySelectorAll('div[search-container]')
		.forEach((searchContainer) => {
			const input = searchContainer.querySelector('input');
			const templateParent = searchContainer.querySelector(
				'div[search-results]',
			);

			input.addEventListener('input', (event) => {
				handleSearchBar(
					searchContainer,
					input,
					templateParent,
					products,
					event,
					searchSliderController,
				);
			});

			input.addEventListener('focus', (event) => {
				handleSearchBar(
					searchContainer,
					input,
					templateParent,
					products,
					event,
					searchSliderController,
				);
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
})();

/**
 * Aside Menus and Scroll-to-Section Functionality
 *
 * This block of code sets up functionality for aside menus and scroll-to-section buttons on a web page.
 * The 'buildAsideMenus' function is called to handle the setup of the aside menus.
 * The 'renderSavedProducts' function is called to render saved products based on the 'builder' object.
 * Event listeners are attached to the scroll-to-section buttons to smoothly scroll to the corresponding sections.
 *
 * - The 'buildAsideMenus' function is called with an array of objects representing aside menu configurations.
 *   Each object contains a selector, element, and action for opening or closing the respective aside menu.
 *   The 'querySelector' method is used to select the menu elements based on their attribute selectors.
 *
 * - Event listeners are attached to each 'go-to-section-button' using the 'querySelectorAll' method.
 *   The buttons are iterated using a forEach loop, and a click event listener is added to each button.
 *   When a button is clicked, a timeout of 120 milliseconds is set to scroll to the corresponding section.
 *   The 'scrollTo' method is used to smoothly scroll to the target section based on its index in the slider containers.
 *   The scroll position is calculated by getting the top position of the target element and accounting for the window size.
 *
 * - The 'renderSavedProducts' function is called to render the saved products based on the 'builder' object.
 *   The 'builder.products' data is passed as an argument to the function.
 */
(() => {
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

	window.document
		.querySelectorAll('button[go-to-section-button]')
		.forEach((button, index) => {
			button.addEventListener('click', () => {
				setTimeout(() => {
					const element = window.document.querySelectorAll(
						'div[product-slider-container]',
					)[index];

					let add =
						element.offsetHeight < 700
							? window.scrollY -
							  window.innerHeight / 2 +
							  element.offsetHeight / 2 +
							  -80
							: window.scrollY - (window.innerWidth >= 870 ? 175 : 220);

					window.scrollTo({
						left: 0,
						top: element.getBoundingClientRect().top + add,
						behavior: 'smooth',
					});
				}, 120);
			});
		});

	renderSavedProducts(builder.products);
})();

/**
 * Initialization and Setup for Product Sections and Actions
 *
 * This block of code initializes and sets up various actions related to product sections on a web page.
 * It selects and manipulates elements related to product sections, prices, and product containers.
 * Event listeners are attached to the save-product buttons to handle saving products.
 *
 * - The 'productSections' variable selects all elements with the attribute 'product-section'.
 *   If the number of product sections is greater than 2, the middle section is given the class '--special'.
 *   This is done by adding the class '--special' to the product section at the index of Math.floor(productSections.length / 2).

 * - The 'querySelectorAll' method is used to select all elements with the attribute 'price'.
 *   A forEach loop is used to iterate over each element, and the text content of the element is converted to a money format.
 *   The 'convertToMoneyFormat' function is called to format the price.

 * - The 'querySelectorAll' method is used to select all elements with the attribute 'product-container'.
 *   A forEach loop is used to iterate over each product container element.
 *   An event listener is added to the 'save-product-button' within each product container.
 *   When the button is clicked, a timeout of 120 milliseconds is set to handle the saving functionality.
 *   The 'product-id' attribute of the current product container is retrieved and added to the 'savedIds' array stored in local storage.
 *   The 'renderSavedProducts' function is called to render the updated list of saved products based on the 'builder' object.
 */
(() => {
	const productSections = window.document.querySelectorAll(
		'div[product-section]',
	);

	if (productSections.length > 2) {
		productSections[Math.floor(productSections.length / 2)].classList.add(
			'--special',
		);
	}

	window.document.querySelectorAll('p[price]').forEach((p) => {
		p.innerText = convertToMoneyFormat(Number(p.innerText));
	});

	window.document.querySelectorAll('div[product-container]').forEach((div) => {
		div
			.querySelector('button[save-product-button]')
			.addEventListener('click', () => {
				setTimeout(() => {
					const savedIds = JSON.parse(localStorage.getItem('saved'));
					savedIds.push(div.getAttribute('product-id'));
					localStorage.setItem('saved', JSON.stringify(savedIds));

					renderSavedProducts(builder.products);
				}, 120);
			});
	});
})();

/**
 * Image Slider Functionality for Propaganda Container
 *
 * This block of code sets up functionality for an image slider within a propaganda container on a web page.
 * It initializes a controller object to store relevant elements and properties for the image slider.
 * An interval is set up to automatically scroll the images in the slider.
 * Event listeners are attached to buttons within the image slider container for touch or mouse interactions.
 * A resize event listener is added to handle repositioning of the slider on window resize.

 * - The 'controller' object is created to store elements and properties related to the image slider.
 *   It selects the image slider container, the image slider itself, and counts the number of images in the slider.
 *   It also initializes properties for the current index, direction of scrolling, and the moving state.

 * - An interval is set up to trigger every 10000 milliseconds (10 seconds).
 *   Depending on the value of 'controller.goingLeft', the 'handlePropagandaScroll' function is called with the appropriate direction.

 * - A variable 'restoreIsMoving' is declared to track the moving state restoration timeout.

 * - Event listeners are added to the buttons within the image slider container.
 *   The event type is determined based on the user agent (touchstart for mobile devices, mousedown for desktop).
 *   When a button is triggered, the 'isMoving' property of the controller is set to true and the 'handlePropagandaScroll' function is called.
 *   The direction of scrolling is determined based on the index of the button.
 *   A timeout is set to restore the 'isMoving' property to false after 10000 milliseconds.

 * - A resize event listener is added to the window.
 *   When the window is resized, the 'scrollLeft' property of the image slider is adjusted to maintain the current position.
 */
(() => {
	window.document
		.querySelectorAll('div[image-slider-container]')
		.forEach((div) => {
			const controller = {
				imageSliderContainer: div,
				imageSlider: div.querySelector('div'),
				numberOfPropagandas: div.querySelectorAll('img').length,
				currentIndex: 0,
				goingLeft: true,
				isMoving: false,
			};

			setInterval(() => {
				if (controller.goingLeft) {
					handlePropagandaScroll(controller, true);
				} else {
					handlePropagandaScroll(controller, false);
				}
			}, 10000);

			let restoreIsMoving;
			let move = true;

			controller.imageSliderContainer
				.querySelectorAll('button')
				.forEach((button, index) => {
					button.addEventListener(
						/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
							? 'touchstart'
							: 'mousedown',
						() => {
							if (!move) {
								return;
							}

							move = false;

							setTimeout(() => {
								move = true;
							}, 600);

							if (restoreIsMoving) {
								clearTimeout(restoreIsMoving);
							}

							controller.isMoving = true;

							handlePropagandaScroll(
								controller,
								index === 0 ? false : true,
								true,
							);

							restoreIsMoving = setTimeout(() => {
								controller.isMoving = false;
							}, 10000);
						},
					);
				});

			window.addEventListener('resize', () => {
				controller.imageSlider.scrollLeft =
					(controller.imageSlider.scrollWidth /
						controller.numberOfPropagandas) *
					controller.currentIndex;
			});
		});
})();
