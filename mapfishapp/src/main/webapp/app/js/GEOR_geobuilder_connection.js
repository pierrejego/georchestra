Ext.namespace("GEOR");

(function(){

var managedFeatureClasses = [];

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
	
	// Boucle de maintien de session active
	
	function keepSession(){
		setTimeout(function(){
			Ext.Ajax.request({
				method: 'GET',
				url: Fusion.getFusionURL() + 'cfm/keepSession.cfm',
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
            
            var respJson = JSON.parse(response.responseText)
            if (respJson.status !== 'ok') {
                throw new Error('Connection failed');
            }
            var data = respJson.data;


            //Si on se reconnecte, il faut supprimer le menu geobuilder et le tab panel geobuilder
            if (isReconnect) {
                GEOR.geobuilder_destroyMenu(mapPanel);
                GEOR.geobuilder_destroyGeobuilderTab();
            }

            // Appel de la fonction d'init du menu geobuilder dans la toolbar
            GEOR.geobuilder_initMenu(mapPanel);
            
            // On mémorise les id_objet disponibles pour le profil pro courant
            managedFeatureClasses = data.geobuilderLayers || [];

            // Lors d'une première connexion, on appelle la liste des modules, le chargement des 
            // iframes et la boucle de maintient de session active
            if (!isReconnect) {
            	// Appel de la fonction d'init de la liste des modules geobuilder dans la toolbar
            	GEOR.geobuilder_initListeModule(mapPanel);
            	// Load all 5 IFRAMEs for geobuilder to use
            	GEOR.geobuilder_loadIFRAMES();
            	// boucle de maintien de session active
            	keepSession();
            }
        	return true;
        },
        failure: function (response) {
        	console.error(response.responseText);
        	return false;
        }
    });
	
};

/**
 * It's a geobuilder layer if the layer name starts with three alphanum
 * characters (underscore allowed), followed by an underscore, AND the first
 * three characters must exist in managedFeatureClasses.
 * 
 *     "ABC_SOMETHING" -> managed if "ABC" in managedFeatureClasses
 *     "AB__SOMETHING" -> managed if "AB_" in managedFeatureClasses
 *     "ABCD_SOMETHING" -> not managed
 * 
 * Tells if the layer is registered as a feature class in Geobuilder
 * @param layerName {String} The layer name
 */
GEOR.geobuilder_isManagedLayer = function (layerName) {
    var re = /^([A-Za-z0-9_]{3})_/;
    var match = re.exec(layerName);
    return (null !== match) && managedFeatureClasses.indexOf(match[1]) !== -1;
}; 

}());
