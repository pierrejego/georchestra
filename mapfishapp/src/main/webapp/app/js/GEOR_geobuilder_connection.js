Ext.namespace("GEOR");

GEOR.geobuilder_connection = function (mapPanel, idProfil, isReconnect) {
	// Connect to geobuilder server and create session 
    var url = GEOR.config.GEOBUILDER_URL + GEOR.config.GEOBUILDER_CFM_LOGIN;
	
	var params = {site: 1};
	
	if (idProfil) {  
		//On passe unqiuement le trigramme a geobuilder
		var profils = idProfil.split(GEOR.config.GEOBUILDER_GROUPE_LDAP);
		if (profils.length === 2) {
			params.idPro = profils[1];
		}
	}
	
	// Boucle de maintien de session active
	
	function keepSession(){
		setTimeout(function(){
			Ext.Ajax.request({
				url: Fusion.getFusionUrl() + 'cfm/keepSession.cfm',
				success: keepSession,
				failure: keepSession
			});
		}, 30 * 1000);
	}
	

	
    Ext.Ajax.request
    ({
        url: url,
        method: 'GET',
        params: params,
        headers: {
        	Accept: 'application/json'
        },
        success: function (response) {
        	
        	//Si on se reconnecte, il faut supprimer le menu geobuilder et le tab panel geobuilder
        	if (isReconnect) {
        		GEOR.geobuilder_destroyMenu(mapPanel);
        		GEOR.geobuilder_destroyGeobuilderTab();
        	}
        	
            // Appel de la fonction d'init du menu geobuilder dans la toolbar
            GEOR.geobuilder_initMenu(mapPanel);
            
            // Lors d'une première connexion, on appelle la liste des modules, le chargement des 
            // iframes et la boucle de maintient de session active
            if (!isReconnect) {
                // Appel de la fonction d'init de la liste des modules geobuilder dans la toolbar
                GEOR.geobuilder_initListeModule(mapPanel);
            	// Load all 5 IFRAMEs for geobuilder to use
            	GEOR.geobuilder_loadIFRAMES();
            	// boucle de maintien de session active
            	keepSession()
            }
        	return true;
        },
        failure: function (response) {
        	console.log(response.responseText);
        	return false;
        }
    });
	
};