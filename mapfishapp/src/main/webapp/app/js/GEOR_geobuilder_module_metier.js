Ext.namespace("GEOR");

/**
 * Init module combobox
 */
GEOR.geobuilder_initListeModule = function (mapPanel) {
	
	//Creation de combobox de la liste des module métier seulement si l'utilisateur a au moins un role module métier
	var isUserAuthorized = false;
	Ext.each(GEOR.config.ROLES, function(roles) {
		if (roles.indexOf(GEOR.config.GEOBUILDER_GROUPE_LDAP) > -1){
			isUserAuthorized = true;
			return;
		}
	});
	
	// Only 
	if (isUserAuthorized){
		
		//Récupération de la liste total des modules en JSon
	    var url = GEOR.config.GEOBUILDER_URL + GEOR.config.GEOBUILDER_CFM_PROFILES;
		Ext.Ajax.request
	    ({
	        url: url,
	        method: 'GET',
	        params: {},
	        scope: this,
	        success: function (response) {
	        	if (response && response.responseText) {
	        		
		            try{
		            	// exemple de réponse
		            	//  {"status":"ok","data":{"pros":[{"id":"IFT","name":"Infra Territoire","status":null}],"locs":[{"id":"ADM","name":"admin","sites":[1]}]}}
			            var data = JSON.parse(response.responseText);
			            //On constitue la liste des modules si l'utilisateur à au moins 1 profil
			            // et qu'il y a au moins 2 profils dans la réponse (DEF étant le profil par defaut toujours renvoyé)
			            if (data && data.data && data.data.pros && data.data.pros.length > 1
			            		&& GEOR.config.ROLES.length > 0) {
				            
				            //Init lis
				            var moduleDropDown = [];
				            
				            /*
		            		 * On selectionne le module de base par defaut
		            		 * sauf si on a passé en paramètre le module à charger
		            		 * DEF si le module n'existe pas das geobuilder
		            		 */
		            		var module = 'DEF';
				            
				            //La liste des profils est filtrée côté geobuilder
				            var nbProfil = 0;
		            		Ext.each(data.data.pros, function(profil) {
					           	moduleDropDown[nbProfil] = {id: profil.id, name: profil.name};
					           	// Selection le module pour la combobox
					           	if (profil.name == GEOR.config.CUSTOM_MODULE) {
			            			module = GEOR.config.CUSTOM_MODULE;
	       						}	        				 		        
					           	nbProfil++;
		            		});
		            			            		
		            		//Si l'utilisateur à accès à au moins un module
		            		if (moduleDropDown.length > 0) {
		            		
			            		//Creation du store pour la combo
			            		var storeCombo = new Ext.data.ArrayStore({
		            		        autoDestroy: true,
		            		        fields: ['id', 'name'],
		            		        data : moduleDropDown
		            		    });
			            		//Bug extjs, on doit remplir le chams data des items 
			            		//du store pour afficher les libellés de la combo
			            		for (var i = 0; i < storeCombo.totalLength; i++) {
			            			storeCombo.data.items[i].data = storeCombo.data.items[i].json;
			            		}
			               		
			            		/*
			            		 * Methodes pour la combo
			            		 */
			            		//Methode de recherche du contexte selon le module métier sélectionné
			            		var searchContext = function(moduleMetier) {
			            			var fileContext = undefined;
			            			// WMC default map
			            			var defautContext = "default";
			            			
			            			//On cherche le contexte associé au module selectionné 
			            			//Le nom du fichier est le nom du profil
			            			Ext.each(GEOR.config.CONTEXTS, function(context) {
			            				
			            				var contextTitle = context.title;
			            				// Le WMC doit doit etre nommé ROLE_SV_PWRS_xxxx_'moduleMetier'_default.wmc
			            				if(contextTitle && moduleMetier!==defautContext &&
			            						(contextTitle.indexOf(GEOR.config.GEOBUILDER_GROUPE_LDAP) > -1) && 
			            						(contextTitle.indexOf(moduleMetier) > -1) &&
			            						(contextTitle.indexOf(defautContext) > -1)){
		        							fileContext = context.wmc;
		        							return;
		        						}
			            			});
									//Si il n'y a pas de fichier correspondont, on prend le context par defaut
			            			if (fileContext === undefined || moduleMetier =="DEF") {
				            			Ext.each(GEOR.config.CONTEXTS, function(context) {
		            						if (context.title === defautContext ) {
		            							fileContext = context.wmc; 
		            							return;
		            						}
		            				    });
			            			}
			            			return fileContext;
			            		}
			            		
			            		//Méthode en cas d'erreur du chargement du contexte
			            		var onFailure = function(msg) {
			            	        GEOR.util.errorDialog({
			            	            msg: tr(msg)
			            	        });
			            	        GEOR.waiter.hide();
			            	    };
			            		
			            	    //Creation de la combobox
			            		var combo = new Ext.form.ComboBox({
			            		    store: storeCombo,
			            		    width:110,
			            		    cls: 'comboModuleMetier',
			            		    displayField: 'name', 
			            		    valueField: 'id',
			            		    fieldLabel: 'name',
			            		    editable: false, 
			            		    forceSelection:true,
			            		    value: module,
			            		    mode: 'local',
			            		    triggerAction: 'all',
			            		    listeners: {
			                            "select": function(combo, record) {
				            		    	 GEOR.waiter.show();
				            		    	 
				            		    	 //Reconnexion avec le nouveau profil
				            		         GEOR.geobuilder_connection(mapPanel, record.data.id, true);
				            		    	 
				            		    	//Récupération du fichier wmc
				            		    	 var fileContext = searchContext(record.data.id);
				            		    	 
				            		    	 //Récupération du flux wmc
				            		         OpenLayers.Request.GET({
				            		             url: GEOR.util.getValidURI(fileContext),
				            		             success: function(response) {
				            		                 GEOR.waiter.hide();
				            		                 //Mise à jour et recharge du nouveau contexte
				            		                 GEOR.wmc.read(response.responseXML, true, true);
				            		             },
				            		             failure: onFailure.createCallback("Could not find WMC file")
				            		         });		            		         
			                            },
			                            'expand'   : function(combo) { //Méthode pour enlever le curseur dans la combo
			                                var blurField = function(el) {
			                                    el.blur();
			                                }
			                                blurField.defer(10,this,[combo.el]);
			                            },
			                            'collapse'   : function(combo) {//Méthode pour enlever le curseur dans la combo
			                                var blurField = function(el) {
			                                    el.blur();
			                                }
			                                blurField.defer(10,this,[combo.el]);
			                            }
		
			            		    },
			            		    iconCls: 'no-icon' //use iconCls if placing within menu to shift to right side of menu
			            		});
			            		
			            		//On cherche la position ou l'on doit insérer ce menu (Avant le menu Outils)
					            var position;
				            	var listeItems = mapPanel.toolbars[0].items;			 
					            for (var i = 0; i < listeItems.length; i++) {
					            	if (listeItems.items[i].text === tr('Tools')) {
					            		position = i;
					            		break;
					            	}
					            }			            
			            		mapPanel.getTopToolbar().insertButton(position, combo);
					            		            
					            /**
					             * Affichage de la nouvelle toolbar
					             */
					            mapPanel.doLayout();
		            		}
			            }
			        }catch(e){
			        	//error in the above string(in this case,yes)!
			        	console.error(e);
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
	}
	
};



