(async () => {
	const header = await (await fetch('/api/header')).json();
     const propagandas = await(await fetch('/api/propagandas')).json();
     const categories = await(await fetch('/api/propagandas')).json();
     const products = await(await fetch('/api/propagandas')).json();
     const footer = await(await fetch('/api/footer')).json();

     buildHead(header)
     buildHeader(header)
     buildPropagandas(propagandas, footer)
})()