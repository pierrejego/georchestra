Ext.namespace("GEOR");

GEOR.geobuilder_connection = function (options, self) {

	// Connect to geobuilder server and create session + token for authentication
	console.log(options.urlGeobuilder + options.cfmGenToken);
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
        	console.log(url);
            Ext.Ajax.request
            ({
                url: url,
                method: 'GET',
                params: {
                	token: token
                },
                success: function (response) {
                    // Appel de la fonction d'init du menu geobuilder dans la toolbar
                    GEOR.geobuilder_initMenu(options);

                	// Load all 5 IFRAMEs for geobuilder to use
                	console.log('o');
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