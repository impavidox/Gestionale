
app.controller('gestione-ricevuta', function($scope, $rootScope, $stateParams) {
	
	$scope.date = new Date();
	$scope.viewTable = false;
	$scope.viewScelta = false;
	$scope.showListUser = true;
	$scope.showListfacture = false;
	
	$scope.search = function(){
		var nome = null;
		var cognome = $scope.cognome;
		rest('socio/retrieveSocio/' + nome + '/' + cognome + '/0/0/0/0').query()
			.$promise.then(function(x){
				$scope.data = x;
				$scope.viewTable = true;
		});		
	}
	
	$scope.dateCompare = function(date){
//		console.log('dateCompare :' + date)
		if (date == undefined) return 2;
		var toDaY = new Date();
		var myDate = new Date(date);
		if (myDate > toDaY) return 1;
		return 0;
	}
	
	$scope.socioSelected = function(x){
		if (x.tesseraNumber == 0){
			alert('il socio ' + x.nome + ' ' + x.cognome + ' non inscritto/a per l\'anno corrente');
		} else {
			$scope.utenteSelected = x;
			$scope.viewScelta = true;
		}
	}
	
    $scope.closeAlert = function() {
    	$rootScope.showHeader = true; 
       	$scope.viewScelta = false;			
	}
    $scope.ricevutaNorm = function(){
    	$rootScope.showHeader = false; 
    	$rootScope.goNewTab('ricevuta', {'idsocio' : $scope.utenteSelected.id, 'reprint' : 0});
    }
 
    $scope.runScheda = function(){
     	$rootScope.showHeader = false; 
    	$rootScope.goNewTab('scheda', {'idsocio' : $scope.utenteSelected.id});
    }
 
    $scope.runFattura = function(){
       	rest('ricevuta/retrieveRicevutaForUser/' +  $scope.utenteSelected.id + '/' + $scope.utenteSelected.tesseraNumber).query()
		.$promise.then(function(x){
			$scope.lRicevuta = x;
			
	    	$scope.showListUser = false;
	       	$scope.viewScelta = false;	
	    	$scope.showListfacture = true;
	    	$scope.viewSceltaList = false;
		});		
    }
	$scope.$root.$on("update_list_fattura", function(event) {
     	rest('ricevuta/retrieveRicevutaForUser/' +  $scope.utenteSelected.id + '/' + $scope.utenteSelected.tesseraNumber).query()
		.$promise.then(function(x){
			$scope.lRicevuta = x;
		});
	});
    
    $scope.backFattura = function(){
    	$scope.showListUser = true;
       	$scope.viewScelta = false;	
    	$scope.showListfacture = false;
      	
    }
	
});