Ext.namespace("GEOR");

GEOR.geobuilder_initListeModule = function (mapPanel, options) {
	var options = [];
	options.nbIconesGeobuilderVisible = 5;
	options.urlGeobuilder = "http://localhost/geobuilder/";
	options.cfmGenToken = "cfm/q_gentoken.cfm";
	options.cfmLogin = "cfm/loginGeoOrchestra.cfm";
	options.cfmMenu = "cfm/wmenu.cfm";
	options.cfmProfiles = "cfm/q_getProfiles.cfm";
	options.repoImagesGeobuilder= "ggis_images/";
	options.groupeLdap="EL_PWRS_APPLI_";
	
	//Creation du menu geobuilder
	
	//Récupération du menu JSon
    var url = options.urlGeobuilder + options.cfmProfiles;
	Ext.Ajax.request
    ({
        url: url,
        method: 'GET',
        params: {},
        scope: this,
        success: function (response) {
        	if (response && response.responseText) {
        		
	            try{
		            var data = JSON.parse(response.responseText);
		            
		            if (data) {
			            //On cherche la position ou l'on doit insérer ce menu
			            var listeItems = mapPanel.toolbars[0].items;
			            
			            var position;
			            for (var i = 0; i < listeItems.length; i++) {
			            	if (listeItems.items[i].text === tr('Tools')) {
			            		position = i;
			            		break;
			            	}
			            }
			            
			           var moduleDropDown = [{
	            			id: 'default',
	            			name: tr("Module de base")			
			           }];

			            //Pour chaque menu geobuilder, on l'ajoute à la toolbar
			            //A partir du certain nombre de menu, on crée un menu Dropdown pour mettre la suite des menus Geobuilder
	            		for (var i = 0; i < data.data.pros.length; i++) {
			            	var id = options.groupeLdap + data.data.pros[i].id;
			            	var name = data.data.pros[i].name;
			            	moduleDropDown[i+1] = {
		            			id: id,
		            			name: name             			
		            		};
			            }
	            		
	            		var storeCombo = new Ext.data.ArrayStore({
            		        autoDestroy: true,
            		        fields: ['id', 'name'],
            		        data : moduleDropDown
            		    });
	            		
	            		for (var i = 0; i < storeCombo.totalLength; i++) {
	            			storeCombo.data.items[i].data = storeCombo.data.items[i].json;
	            		}
	            		
	            		var combo = new Ext.form.ComboBox({
	            		    store: storeCombo,
	            		    displayField: 'name', 
	            		    valueField: 'id',
	            		    fieldLabel: 'name',
	            		    editable: false, 
	            		    forceSelection:true,
	            		    value: 'default',
	            		    mode: 'local',
	            		    triggerAction: 'all',
	            		    listeners: {
	                            "select": function(combo, record) {
	                                console.log(record.data);
		            		    	console.log(combo);
	                            },
	                            'expand'   : function(combo) {
	                                var blurField = function(el) {
	                                    el.blur();
	                                }
	                                blurField.defer(10,this,[combo.el]);
	                            },
	                            'collapse'   : function(combo) {
	                                var blurField = function(el) {
	                                    el.blur();
	                                }
	                                blurField.defer(10,this,[combo.el]);
	                            }

	            		    },
	            		    iconCls: 'no-icon' //use iconCls if placing within menu to shift to right side of menu
	            		});
	            		
	            		mapPanel.getTopToolbar().insertButton(position, combo);
			            		            
			            /**
			             * Affichage de la nouvelle toolbar
			             */
			            mapPanel.doLayout();
		            } else {
		            	console.error(data);
		            }
		        }catch(e){
		        	//error in the above string(in this case,yes)!
	                console.error(response.responseText);
	            }
        	} else {
        		console.error(response);
        	}
        },
        failure: function (response) {
        	console.error(response.responseText);
        }
    });
};

