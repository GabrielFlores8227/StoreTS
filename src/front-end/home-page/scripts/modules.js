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
			slideToNextImage();
		} else {
			slideToPrevImage();
		}
	}, 10000);

	let event = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'touchstart' : 'mousedown';

	imageSliderContainer.querySelector('button:first-of-type').addEventListener(event, () => slideToPrevImage());
	imageSliderContainer.querySelector('button:last-of-type').addEventListener(event, () => slideToNextImage());

	function slideToPrevImage() {
		isMoving = true;
		currentIndex--;

		imageSlider.scrollTo({
			left: (imageSlider.scrollWidth / numberOfPropagandas) * currentIndex,
			top: 0,
			behavior: 'smooth',
		});

		if (currentIndex <= 0) {
			currentIndex = 0;
			goingLeft = true;
		}
	}

	function slideToNextImage() {
		isMoving = true;
		currentIndex++;

		imageSlider.scrollTo({
			left: (imageSlider.scrollWidth / numberOfPropagandas) * currentIndex,
			top: 0,
			behavior: 'smooth',
		});

		if (currentIndex + 1 >= numberOfPropagandas) {
			currentIndex = numberOfPropagandas - 1;
			goingLeft = false;
		}
	}
}

const sliderController = [];
function setProductSlider() {
	window.document.querySelectorAll('[product-slider-container]').forEach((element, index) => {
		sliderController.push(true);
		let isDown = false;
		let startX;
		let position;
		let left;
		let scrollLeft;
		let sliderControllerSetted = false;

		setInterval(() => {
			if (element.scrollWidth - element.clientWidth < 80) {
				return;
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
}

function convertToMoneyFormat(number) {
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function scrollTop(element) {
	window.scrollTo({
		left: 0,
		top: getOffset(element).top - (window.innerWidth >= 700 ? 161 : 224),
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
