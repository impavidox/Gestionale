app.controller('main-content', function($scope) {
	$scope.tabs = [
		{
			id:'Prima nota',
			name : 'Prima Nota',
			content: './content/prima-nota.html'
		},
		{
			id:'Nuovo',
			name : 'Nuovo socio',
			content: './content/nuovo-utente.html'
		},
//		{
//			id:'Gestione Ricevuta',
//			name : 'Gestione Ricevuta',
//			content: './content/gestione-ricevuta.html'
//		},
		{
			id:'Elenco Soci',
			name : 'Elenco Soci',
			content: './content/elenco-soci.html'
		},
		{
			id:'Libro Socio',
			name : 'Libro Socio',
			content: './content/libro-socio.html'
		},
		{
			id:'Parametri',
			name : 'Parametri',
			content: './content/parametri.html'
		},		
	];
	for(var i=0;i<$scope.tabs.length;i++){
		if ($scope.tabs[i].id== $scope.toVisu) $scope.attiva=$scope.tabs[i].content;
	}
	$scope.toVisu = 'Prima nota';
	
	$scope.setAttiva=function(x){
		$scope.toVisu = x;
		for(var i=0;i<$scope.tabs.length;i++){
			if ($scope.tabs[i].id== $scope.toVisu) $scope.attiva=$scope.tabs[i].content;
		}
	}
	
});