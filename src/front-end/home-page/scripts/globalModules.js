const browserLanguage = navigator.language;

function buildHead(header) {
	window.document.querySelector('link[rel="shortcut icon"]').setAttribute('href', header.icon);
	window.document.querySelector('title').innerText = header.title;
	window.document.querySelector('meta[name="description"]').setAttribute('content', header.description);
	window.document.documentElement.style.setProperty('--primary-color', header.color);
}

function buildHeader(header) {
	window.document.querySelector('img[store-logo]').setAttribute('src', header.logo);
}

function buildPropagandas(propagandas, footer) {
     const templateParent = window.document.querySelector("div[propagandas-container]")

     if (templateParent.children.length !== 1) {
          return
     }

	window.document.querySelector("p[store-info]").innerText = footer.storeInfo

     propagandas.forEach((propaganda) => {
          const template = templateParent.querySelector("template").cloneNode(true).content.children[0]

          template.querySelector("source[big-image]").setAttribute("srcset", propaganda.bigImage)
          template.querySelector("img[small-image]").setAttribute("src", propaganda.smallImage)

          templateParent.append(template)
     }); 

     const imageSlider = window.document.querySelector("[image-slider]");
	const numberOfPropagandas = window.document.querySelectorAll("img[small-image]").length
	let currentIndex = 1;
	let goingLeft = true;

	setInterval(() => {
		const targetIndex = (imageSlider.scrollWidth / numberOfPropagandas) * currentIndex;

		imageSlider.scrollTo({
			left: targetIndex,
			top: 0,
			behavior: "smooth",
		});

		goingLeft ? currentIndex++ : currentIndex--;
		if (currentIndex === numberOfPropagandas) goingLeft = false;
		if (currentIndex === 0) goingLeft = true;
     }, 10000);

	imageSlider.addEventListener("scroll", (e) => e.preventDefault())
	imageSlider.addEventListener("touchmove", (e) => e.preventDefault())
}