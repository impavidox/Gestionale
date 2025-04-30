app.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider.state({
		name : 'main',
		url : '/home',
		templateUrl : 'content/main-content.html',
		controller: 'main-content'
	});
	$stateProvider.state({
		name : 'ricevuta',
		url : '/ricevuta/:idsocio?reprint&abbo&ricevuta',
		templateUrl : 'content/ricevuta.html',
		controller: 'ricevuta'
	});
	
	$stateProvider.state({
		name : 'scheda',
		url : '/scheda/:idsocio',
		templateUrl : 'content/scheda.html',
		controller: 'scheda'
	});
	$stateProvider.state({
		name : 'search',
		url : '/search/:cognome/:scadenza/:attivita/:scadute/:anno/:titolo',
		templateUrl : 'content/ricerca.html',
		controller: 'ricerca'
	});

	$stateProvider.state({
		name : 'email',
		url : '/email/:cognome/:scadenza/:attivita/:scadute/:anno/:titolo',
		templateUrl : 'content/email.html',
		controller: 'email-manager'
	});
	
	$stateProvider.state({
		name : 'libroSocio',
		url : '/libroSocio/:affiliazione/:begin/:end/:tipo',
		templateUrl : 'content/libro-socio-print.html',
		controller: 'libro-socio-print'
	});
	
	$stateProvider.state({
		name : 'primaNota',
		url : '/primanota/:type?begin&end',
		templateUrl : 'content/prima-nota-print.html',
		controller: 'prima-nota-print'
	});

});