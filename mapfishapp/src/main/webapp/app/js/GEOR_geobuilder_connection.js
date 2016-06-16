Ext.namespace("GEOR");

/**
 * Connect to geobuilder
 * mapPanel -> geoExt MapPanel contening all laysers
 * idProfil -> 3 char corresponding to geobuilder profil
 * isReconnect -> Boolean to now if user was already connected or if this is the first time
 */
GEOR.geobuilder_connection = function (mapPanel, idProfil, isReconnect) {
	// Connect to geobuilder server and create session 
    var url = GEOR.config.GEOBUILDER_URL + GEOR.config.GEOBUILDER_CFM_LOGIN;
	
	var params = {site: 1};
	
	// Check if idProfil existe and equals to 3 char
	// if profil not compliante we don't send it in the request
	// geobuilder will be connected with default profil
	if (idProfil && idProfil.length==3) {  
		params.idPro = idProfil;
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
            
            //Dans le cas d'une reconnexion, on ne rappelle pas la liste des modules et le chargement des iframes
            if (!isReconnect) {
                // Appel de la fonction d'init de la liste des modules geobuilder dans la toolbar
                GEOR.geobuilder_initListeModule(mapPanel);

            	// Load all 5 IFRAMEs for geobuilder to use
            	GEOR.geobuilder_loadIFRAMES();
            }
        	return true;
        },
        failure: function (response) {
        	console.log(response.responseText);
        	return false;
        }
    });
	
};