Ext.namespace("GEOR");

GEOR.geobuilder_connection = function (options, mapPanel) {

	// Connect to geobuilder server and create session + token for authentication
    Ext.Ajax.request
    ({
        url: options.urlGeobuilder + options.cfmGenToken,
    	method: 'GET',
        params: {
        	login: 'lud',
        	password: 'lud',
        	site: '1'
        },
        success: function(response)
        {
        	var data = Ext.util.JSON.decode(response.responseText);
        	var token = data.data.token;
        	var url = options.urlGeobuilder + options.cfmLogin;
        	
            Ext.Ajax.request
            ({
                url: url,
                method: 'GET',
                params: {
                	token: token
                },
                success: function (response) {
                    // Appel de la fonction d'init du menu geobuilder dans la toolbar
                    GEOR.geobuilder_initMenu(mapPanel, options);
                    
                 // Appel de la fonction d'init de la liste des modules geobuilder dans la toolbar
                    GEOR.geobuilder_initListeModule(mapPanel, options);

                	// Load all 5 IFRAMEs for geobuilder to use
                	GEOR.geobuilder_loadIFRAMES();
                	return true;
                },
                failure: function (response) {
                	console.log(response.responseText);
                	return false;
                }
            });
        },
        failure: function(response)
        {
            console.log(response.responseText);
            return false;
        }
    });

	
};