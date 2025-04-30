app.controller('email-manager', function($scope, $rootScope, $stateParams) {
	$rootScope.showHeader = true; 
	$scope.dt = new Date();
	var entry;
	$scope.titolo = $stateParams.titolo.toUpperCase();

	if ($stateParams.cognome != undefined){
		var nome = null;
		var cognome = ($stateParams.cognome.length > 0) ? $stateParams.cognome : null;
		$scope.titolo = $stateParams.titolo.toUpperCase();
		if ($stateParams.attivita > 0) 	$rootScope.incassato = true; 

		rest('socio/retrieveSocioMail/' + nome + '/' + cognome +
				'/' + $stateParams.scadenza + 
				'/' + $stateParams.attivita +
				'/' + $stateParams.scadute + 
				'/' + $stateParams.anno).get()
			.$promise.then(function(x){
				$scope.data = x;
		});		
	}



	 $scope.uploadFile = function(event){
        var result = event.target.files;
        entry = result[0];
        
     
    };

	 $scope.eseguiInvio = function(){
	 		console.log("eseguiInvio");
		 console.log("allegato" +  encodeURIComponent(entry.name));
		 console.log("TextArea:" + $scope.myTextarea);
	 }
	

});