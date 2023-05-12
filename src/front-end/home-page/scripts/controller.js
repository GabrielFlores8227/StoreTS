(async () => {
	const header = await (await fetch('/api/header')).json();

     buildLogo(header.logo)

     showLoadingScreenLogo()

     const propagandas = await(await fetch('/api/propagandas')).json();

     const categories = await(await fetch('/api/propagandas')).json();

     const products = await(await fetch('/api/propagandas')).json();

     const footer = await(await fetch('/api/footer')).json();

     buildHead(header)
     buildPropagandas(propagandas, footer)

     removeLoadingScreen()
})()