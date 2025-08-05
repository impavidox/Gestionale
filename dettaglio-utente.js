app.controller('dettaglio-utente', function($scope, $rootScope) {

	var birthMM;
	var birthProv;
	var birthcomune;
	var birthCode;
	var resProv;
	var rescomune;
	var tipoSocio = 1;
	var compet;
	var feder;
	
	$scope.pageTitle = 'Dettaglio socio';
	$scope.pageMode  ='U';
	
	
	
	$scope.defaultProvince = 0;
	
	$scope.viewAlert = false;	
	$scope.viewAlert1 = false;	
	$scope.viewAbo = false;
	$scope.viewContinue = false;
	$scope.viewError = false;			
	
  	$scope.showRicevuta = false;	
  	$scope.tessNumber = '...';
	$scope.viewFede = false;
	
	$scope.socioCreated = {};
	
	
	$scope.listComm = [];
	$scope.listCommRes = [];
	
	$scope.sessoArray = [
	        {id: 1, name: 'Maschio'},
	        {id: 2, name: 'Femmina'},
	];
	
	    
    $scope.mmvalue = [
    	{label:"Gennaio", id:"01"}, 
		{label:"Febbraio", id:"02"}, 
		{label:"Marzo", id:"03"}, 
		{label:"Aprile", id:"04"}, 
		{label:"Maggio", id:"05"}, 
		{label:"Giugno", id:"06"}, 
		{label:"Luglio", id:"07"}, 
		{label:"Agosto", id:"08"}, 
		{label:"Settembre", id:"09"}, 
		{label:"Ottobre", id:"10"}, 
		{label:"Novembre", id:"11"}, 
		{label:"Dicembre", id:"12"}
	];
    
    rest('activities/retrieveAffiliazioneForLibro/0').query()
		.$promise.then(function(y){
			$scope.AffiliazioneLibro = y;
			$scope.libroOrigin = { value: $scope.AffiliazioneLibro[0] };
	});
    
	 $scope.$watch("loadValue", function(n, o) {
		 if (n){
			 console.log('loadValue ' + n + "/" + o + " privacy:" + $scope.socioSelected.privacy);
			 $scope.viewContinue = false;
			 $scope.viewAbo = false;
 
			 $scope.cognome = $scope.socioSelected.cognome;
			 $scope.nome = $scope.socioSelected.nome;
			 $scope.cfiscale = $scope.socioSelected.codeFiscale;
			 var dObj = {};
			 dObj = $rootScope.retrieveDate($scope.socioSelected.birhDate);
			 
			 $scope.birthJJ = dObj.jj;
			 $scope.selectedMM = { value: $scope.mmvalue[dObj.mm] };
			 birthMM = $scope.mmvalue[dObj.mm].id;
			 console.log('valeur de mm:' + birthMM);
			 $scope.anno = dObj.yyyy;
			 birthcomune = $scope.socioSelected.birthCity;
			 birthCode = $scope.socioSelected.birthCityCode;
			 
			 $scope.birthProv = $scope.socioSelected.birthProv
			 $scope.birthCity = $scope.socioSelected.birthCity

			 var sesso = $scope.socioSelected.sesso - 1;
			 $scope.selectedSesso = { value: $scope.sessoArray[sesso] };
			 $scope.privacy = $scope.socioSelected.privacy;
			 
			 $scope.listProvNascita = rest('geographic/retrieveProvince').query();
			 $scope.listProvNascita.$promise.then(function(result){
				 result.forEach(function(x){
					if (x.description.trim() == $scope.socioSelected.birthProv.trim()) $scope.selectedProv = { value: x };
				 });
			 });  

			 $scope.listCommNascita = rest('geographic/retrievecomune/' + $scope.socioSelected.birthProv.trim()).query();
			 $scope.listCommNascita.$promise.then(function(r){
				 r.forEach(function(x){
					if (x.description.trim() == $scope.socioSelected.birthCity.trim()) $scope.selectedComm = { value: x };
				 });
			 });

			 $scope.listProv = rest('geographic/retrieveProvince').query();
			 $scope.listProv.$promise.then(function(result){
				 result.forEach(function(x){
					if (x.description.trim() == $scope.socioSelected.provRes.trim()) $scope.provRes = { value: x };
				 });
			 });
			 
			 resProv = $scope.socioSelected.provRes.trim();
			 $scope.listCommRes = rest('geographic/retrievecomune/' + $scope.socioSelected.provRes.trim()).query();
			 $scope.listCommRes.$promise.then(function(r){
				 r.forEach(function(x){
					if (x.description.trim() == $scope.socioSelected.citta.trim()) $scope.commRes = { value: x };
				 });
			 });
			 
			 $scope.address = $scope.socioSelected.indirizzo;
			 $scope.cap = $scope.socioSelected.cap;
			 $scope.telefono = $scope.socioSelected.tel;
			 $scope.email = $scope.socioSelected.email;
			 $scope.listTipiSocio = rest('socio/retrieveTipoSocio').query();
			 $scope.listTipiSocio.$promise.then(function(result){
					result.forEach(function(x){
						if (x.tipoId == $scope.socioSelected.tipo.tipoId) $scope.selectedTipo = { value: x };;
					});
			 });
			 tipoSocio = $scope.socioSelected.tipo.tipoId;
			 
			 $scope.viewFede = false;
		     if ($scope.socioSelected.tipo.tipoId == 3){
		    		$scope.viewFede = true;
		    		var i = 0;
		    		
					angular.forEach($scope.AffiliazioneLibro, function(k, v) {
  					if(k.descrizione == $scope.socioSelected.federazione){
  						$scope.libroOrigin = { value: $scope.AffiliazioneLibro[i] };
  						feder = $scope.socioSelected.federazione;
  					}
  					i++;
  				});			
		    		
		     }
			 
			 if ($scope.socioSelected.dateCertificat != null) $scope.certifica = new Date($scope.socioSelected.dateCertificat);
			 $scope.competition = $scope.socioSelected.typeCertificat;
			 $scope.tessNumber = ($scope.socioSelected.tesseraNumber == 0) ? '...' : $scope.socioSelected.tesseraNumber;
			 compet = $scope.socioSelected.typeCertificat;
			 
		 }
	 });

	 $scope.scopeChange = function(s,v){
		 $scope[s] = v;
	 }
	 
	 $scope.next = function(){
		 $scope.viewAbo = true;
	 }
	 
	 $scope.fedeSelected = function(el){
 	  	console.log('fede:' + el.descrizione  )
 		feder = el.descrizione;
 	}
	$scope.cnntrlCreate = function(){
	    var re = rest("socio/controlUserType/" 
	     	+ $scope.cfiscale + 
	     	"/" + tipoSocio)
	     	.get()
	     .$promise.then(function(x){
				if (x.rc)
					cntrol2();
				else {
				    $scope.viewError = true;			
				}
		});	
	     
	}
	function cntrol2(){
		if (tipoSocio == 3){
			if (feder == null) {
				feder =  $scope.AffiliazioneLibro[0].descrizione;
			}
//				$scope.viewAlert1 = true;	
			$scope.create();
		}
		else {
			$scope.viewAlert = true;			
		}	
	
	} 
	 
	 
    $scope.create = function(){
        $scope.viewAlert = false;			
        $scope.viewAlert1 = false;			
    	console.log('>>>>>  birthCode:' + birthCode + ' sesso:' + $scope.selectedSesso.value.id + ' birthday:' + $scope.birthJJ + '-' +birthMM + '-' + $scope.anno);
    	if ($scope.competition != undefined) compet = $scope.competition;
    	if ($scope.privacy == undefined) $scope.privacy = $scope.socioSelected.privacy;
        	if (controlParameters()){
    		var body = {
            		"id" : $scope.socioSelected.id,
        			"nome" :  $scope.nome.toUpperCase(),
        			"cognome" : $scope.cognome.toUpperCase(),
        			"sesso" : $scope.selectedSesso.value.id,
        			"birthday" :  $scope.birthJJ + '-' +birthMM + '-' + $scope.anno,
        			"birthcomuneCode" : birthCode ,
        			"province" : resProv ,
        			"city" : ( rescomune == null) ? $scope.socioSelected.citta :  rescomune,
        			"corso" : $scope.address ,	
        			"cap" : $scope.cap ,	
        			"tipoSocio" : tipoSocio ,	
        			"certifica" :  ($scope.certifica == undefined) ? null : buildDate($scope.certifica) ,	
        			"competition" :compet ,
        			'telefono' : ($scope.telefono == undefined) ? null : $scope.telefono ,
        		   	'email' : ($scope.email == undefined) ? null : $scope.email,
        		   	'privacy' : $scope.privacy,
        		   	'federazione' : feder			
        	};
        	
        	var resultAna = rest("socio/updateSocio").save(body);
        	resultAna.$promise.then(function(result){
        		$scope.viewAbo = result.returnCode;
        		if (!result.returnCode) alert(result.message);
        		$scope.socioUpdated = result.socio;
        		$scope.cfiscale = result.socio.codeFiscale;
        		
        		if (result.socio.abbonamento == null){
        			$scope.tessNumber =  '...';
        			$scope.dateInscr = null;
        			$scope.abbFirmato = false;
        			console.log('tessNumber not validate....');
        		} else {
              		$scope.tessNumber = result.socio.abbonamento.numeroTessara;       		
            		if ($scope.socioUpdated.abbonamento.incription != null) $scope.dateInscr = new Date($scope.socioUpdated.abbonamento.incription);
            		$scope.abbFirmato = $scope.socioUpdated.abbonamento.firmato;
            	}
        	});
        	
    	} else {
    		alert('Tutti parametri non sono stati compilati');
    	}
    	
    }
    
    function controlParameters(){
    	if ($scope.nome == undefined) return false;
      	if ($scope.cognome == undefined) return false;
    	if ($scope.birthJJ == undefined) return false;
     	if ($scope.anno == undefined) return false;
    	if ($scope.address == undefined) return false;
    	if ($scope.cap == undefined) return false;
    	return true;
    }
    function controlAbbonemanto(){
    	if ($scope.dateInscr == undefined) return false;
    	return true;
    }
    $scope.changeTessNumber = function(){
    	alert("changeTessNumber selected..." + $scope.tessNumber);
    }
    $scope.createabo = function(){
       	console.log('>> createabo <<<');
		if (controlAbbonemanto()){
	       	var body = {
				"idSocio" : $scope.socioUpdated.id,
				"idAbonamento" : 0,
				"dateInscription" : buildDate($scope.dateInscr),
				"idAnno" : $rootScope.annoSportiva.id,
				"firmato" : ($scope.abbFirmato == undefined) ? false : $scope.abbFirmato , 
			}
	       	var resultAbo = rest("abbonamento/updateAbonamento").save(body);
	       	resultAbo.$promise.then(function(result){
        		$scope.viewAbo = result.returnCode;
        		if (!result.returnCode) alert(result.message);
        		else {
        			$scope.tessNumber = result.abbonamento.numeroTessara;
        			$scope.viewContinue = true;
        		}
        		
        	});
	       	
		} else {
			alert('Data di inscrizione non valida (gg/mm/aaaa)');
		}
    }
    
    $scope.closeAlert = function() {
       	$scope.viewContinue = false;			
	}

	$scope.closeError = function() {
       	$scope.viewError = false;			
	}


	$scope.closeControl = function() {
       	$scope.viewAlert = false;			
	}

	$scope.closeControl1 = function() {
       	$scope.viewAlert1 = false;			
	}
	
    $scope.ricevuta = function(){
    	console.log('execute ricevuta...');
    	$rootScope.goNewTab('ricevuta', {'idsocio' : $scope.socioUpdated.id , 'reprint' : 0});
    }
 
    $scope.runScheda = function(){
    	console.log('execute runScheda...');
    	$rootScope.goNewTab('scheda', {'idsocio' : $scope.socioUpdated.id});
    }
 
 
    $scope.birthMMS= function(el){
    	birthMM = el.id;
    }
    $scope.provNascitaSelected= function(el){
    	$scope.listCommNascita = rest('geographic/retrievecomune/' + el.code).query();
    }
    $scope.provResSelected = function(el){
      	$scope.listCommRes = rest('geographic/retrievecomune/' + el.code).query();
    }
    $scope.comuneNascitaSelected = function(el){
    	birthcomune = el.description;
    	birthProv = el.provCode
    	birthCode = el.code;
    }
    $scope.comuneResSelected = function(el){
    	rescomune = el.description;
    	resProv = el.provCode
    }
    $scope.tipoSocioSelected= function(el){
    	console.log('tipo socio:' + el.id)
    	tipoSocio = el.id;
    	$scope.viewFede = false;
    	if (el.id == 3){
    		$scope.viewFede = true;
    	}
    	
    }
	function buildDate(myDate){
		var r = null;
		if (myDate != undefined ) {
			var w =  new Date(myDate)
			r =  w.getDate()  +  '-' +( w.getMonth() +1)  + '-' + w.getFullYear(); 
		}
		return r;
	}
	
});