/**
 * Build Aside Menus
 *
 * This function builds aside menus by adding click handlers to the corresponding buttons.
 * It takes an array of objects, 'asideButtonHandler', as a parameter, which specifies the selector, element, and action for each aside menu button.
 *
 * - The 'addClickHandler' function is defined within the scope of 'buildAsideMenus'.
 *   It takes a selector, element, and action as parameters and adds click event listeners to the buttons that match the selector.
 *   When a button is clicked, a timeout of 120 milliseconds is set to add or remove the specified CSS class from the element, depending on the action.

 * - The 'asideButtonHandler' array is iterated using the forEach method.
 *   For each object in the array, the 'addClickHandler' function is called with the selector, element, and action as arguments.
 *   This sets up the click event listeners for the corresponding aside menu buttons.

 * - The 'buildAsideMenus' function does not have a return value. It adds the necessary click event listeners to the aside menu buttons.
 *   The click event handlers modify the CSS class of the specified element to show or hide the aside menu.
 *   This function can be used to build and activate aside menus on a web page.
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
 * Render Saved Products
 *
 * This function renders the saved products on the web page based on the provided 'products' data.
 * It retrieves the saved product IDs from the local storage and compares them with the product IDs in the 'products' data.
 * If a product ID is found in the saved IDs, the corresponding product is rendered in the saved product container.

 * - The function starts by retrieving the saved product IDs from the local storage.
 *   If the saved product IDs are not found, an empty array is set as the initial value in the local storage.
 *   The saved product IDs are then parsed from the storage.

 * - The function clears the existing content in the saved product container by removing all child elements.

 * - The 'Object.values' method is used to iterate over the 'products' data.
 *   For each array of products, the function checks if the product ID is included in the saved product IDs.
 *   If the product is saved, a template is cloned, and the necessary data is filled in.
 *   Event listeners are added to the remove button to handle removing the product from the saved list.

 * - The rendered template is appended to the saved product container.
 *   The height of the template is set to ensure smooth animation during rendering.

 * - The 'renderSavedProducts' function does not have a return value.
 *   It dynamically renders the saved products based on the provided data and handles the remove button click event to update the saved product list accordingly.
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
			const productInstallment = template.querySelector(
				'p[product-installment]',
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

			productInstallment.textContent = product.installment;
			productLink.href = '/api/order/' + product.id;

			templateParent.append(template);
			template.style.height = template.offsetHeight + 21 + 'px';
		});
	});
}

/**
 * Handle Products Grid
 *
 * This function handles the grid layout of the products within the specified element.
 * It checks if the total width of the products in the element is less than the available width.
 * If it is less and the element does not have the '--special' class, the function adjusts the grid layout.

 * - The function calculates the available width by subtracting the client width of the element from its scroll width.
 *   It also considers the left padding of the element.

 * - If the available width is less than the threshold value (the sum of left padding and 280 pixels)
 *   and the element does not have the '--special' class, the function adds the '--special' class to the element.

 * - If the number of children in the element is odd, the grid template columns are adjusted to evenly distribute the products.
 *   Specifically, it sets the grid template columns to '1fr 1fr 1fr' to accommodate three columns.

 * - If the number of children is greater than four, the last child is also given the '--special' class.
 *   This class can be used for styling or indicating a special position within the grid.

 * - The 'handleProductsGrid' function does not have a return value.
 *   It modifies the grid layout of the products within the specified element based on the conditions described above.
 */

export function handleProductsGrid(element) {
	if (
		element.scrollWidth - element.clientWidth <
			Number(window.getComputedStyle(element).paddingLeft.replace('px', '')) +
				280 &&
		!element.classList.contains('--special')
	) {
		element.classList.add('--special');

		if (element.children.length % 2 !== 0) {
			element.style.gridTemplateColumns = '1fr 1fr 1fr';

			if (element.children.length > 4) {
				element.children[element.children.length - 1].classList.add(
					'--special',
				);
			}
		}
	}
}

/**
 * Handle Propaganda Scroll
 *
 * This function handles the scrolling of the propaganda images within a slider.
 * It takes a controller object, a direction flag, and an optional ignoreIsMoving flag.

 * - The controller object contains the necessary properties to track and control the scrolling behavior.
 *   It includes references to the image slider container, image slider, number of propagandas,
 *   current index, direction flag, and isMoving flag.

 * - The forward parameter determines the scrolling direction.
 *   If it is true, the currentIndex is incremented; otherwise, it is decremented.

 * - If the isMoving flag is true and the ignoreIsMoving flag is false, the function returns early without performing any action.
 *   This check prevents unintended scrolling when the slider is in motion.

 * - The function uses the scrollTo() method to scroll the image slider to the appropriate position based on the current index.
 *   The left position is calculated by dividing the scroll width of the slider by the number of propagandas
 *   and multiplying it by the current index.

 * - After scrolling, the function checks if the currentIndex has reached the end of the propagandas.
 *   If so, it adjusts the currentIndex and sets the goingLeft flag to false to change the scrolling direction.

 * - Similarly, if the currentIndex has reached the beginning (index 0), the function adjusts the currentIndex
 *   and sets the goingLeft flag to true to change the scrolling direction.

 * - The 'handlePropagandaScroll' function does not have a return value.
 *   It modifies the scroll position and flags of the image slider based on the specified direction and conditions.
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

	if (controller.currentIndex + 1 >= controller.numberOfPropagandas) {
		controller.currentIndex = controller.numberOfPropagandas - 1;
		controller.goingLeft = false;
	}

	if (controller.currentIndex <= 0) {
		controller.currentIndex = 0;
		controller.goingLeft = true;
	}
}

/**
 * Handle Search
 *
 * This function handles the search functionality for filtering products based on user input.
 * It takes the search container, input element, template parent element, products object,
 * event object, and slider controller as parameters.

 * - The formatString function is defined within the scope of handleSearch.
 *   It takes a string, converts it to lowercase, removes spaces, normalizes diacritics,
 *   and removes diacritic marks. This function is used to format the search value and product names for comparison.

 * - The value variable stores the formatted search value extracted from the event target value.

 * - The template variable references the template element within the template parent.

 * - The numberOfSelectedProducts variable keeps track of the number of selected products found in the search.

 * - Before performing a new search, existing buttons within the template parent are removed.

 * - The products object is iterated using Object.values to access the products for each key.
 *   The key represents a specific category or type of product.

 * - For each product, the formatted product name is obtained using the formatString function.

 * - If the formatted product name does not include the search value, the loop skips to the next iteration.

 * - If the number of selected products exceeds 3, the loop terminates.

 * - If a product matches the search criteria, a clone of the template is created and modified accordingly.
 *   The template image, name, and price elements are updated with the corresponding product details.

 * - An event listener is added to the clone to handle the click event when a product card is selected.
 *   Inside the listener, the sliderController is updated, and the scroll position is adjusted to bring the product into view.

 * - The modified clone is appended to the template parent.

 * - The search container is toggled to '--on' if there are selected products, indicating search results.
 *   The input element is toggled to '--none' if there are no selected products, hiding it from view.

 * - The 'handleSearch' function does not have a return value.
 *   It performs the search, modifies the DOM, and updates the display based on the search results.
 */

export function handleSearch(
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
						left: 0,
						top:
							productCard.getBoundingClientRect().top +
							window.scrollY -
							window.innerHeight / 2 +
							productCard.offsetHeight / 2 +
							-60,
						behavior: 'smooth',
					});

					setTimeout(() => {
						if (productSliderContainer.scrollLeft === 0) {
							return;
						}

						productSliderContainer.scrollTo({
							left:
								productCard.getBoundingClientRect().left +
								productSliderContainer.scrollLeft -
								window.innerWidth / 2 +
								productCard.offsetWidth / 2,
							top: 0,
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
 * Convert to Money Format
 *
 * This function converts a number to a formatted currency string.
 * It takes a number as input and returns the formatted string in the format '$X.XX'.
 *
 * The function uses the toLocaleString() method with the 'en-US' locale and options
 * to specify the style as 'currency' and the currency as 'USD'.
 *
 * Example usage:
 * convertToMoneyFormat(1000); // Returns '$1,000.00'
 *
 * @param {number} number - The number to be converted to currency format.
 * @returns {string} The formatted currency string.
 */

export function convertToMoneyFormat(number) {
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
