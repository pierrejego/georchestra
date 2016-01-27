Ext.namespace("GEOR");

GEOR.geobuilder_initListeModule = function (mapPanel) {
	//Creation de combobox de la liste des module métier
	
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
		            var data = JSON.parse(response.responseText);
		            //On constitue la liste des modules si l'utilisateur à au moins 1 profil
		            if (data && data.data && data.data.pros && data.data.pros.length > 0
		            		&& GEOR.config.GEOBUILDER_ROLES.length > 0) {
		            	
			            /*
			             *
			             * Constitution de la liste des modules
			             * 
			             */
			            
			            //On ajoute le module de base
			            var moduleDropDown = [{
	            			id: 'default',
	            			name: tr("Module de base")			
			            }];
			            
			            //Pour chaque role de l'utilisateur, on récupère le nom du profil
			            var nbProfil = 1;
	            		Ext.each(GEOR.config.GEOBUILDER_ROLES, function(role) {
	            			Ext.each(data.data.pros, function(profil) {
				            	var idProfil = GEOR.config.GEOBUILDER_GROUPE_LDAP + profil.id;
	            				if (idProfil === role) {
					            	var name = profil.name;
					            	moduleDropDown[nbProfil] = {
				            			id: idProfil,
				            			name: profil.name             			
				            		};
					            	nbProfil++;
					            	return;
	            				}
	            			});
	            		});
	            		
	            		//TODO a enlever pour test
	            		moduleDropDown[nbProfil] = {
	            			id: "ROLE_EL_TEST",
	            			name: "metier test"             			
	            		};//FIN TODO a enlever pour test
	            		
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
	            		 * On selectionne le module de base par defaut
	            		 * sauf si on a passé en paramètre le module à charger
	            		 */
	            		var module = 'default';
	            		if (GEOR.config.CUSTOM_MODULE) {
	            			//On vérifie si l'utilisateur à bien les droits
        					Ext.each(GEOR.config.GEOBUILDER_ROLES, function(role) {
        						if (role === GEOR.config.CUSTOM_MODULE ) {
        							module = GEOR.config.CUSTOM_MODULE;
        							return;
        						}
        				    });
	            		}
	            		
	            		
	            		/*
	            		 * Methodes pour la combo
	            		 */
	            		//Methode de recherche du contexte selon le module métier sélectionné
	            		var searchContext = function(moduleMetier) {
	            			var fileContext = undefined;
	            			
	            			//On cherche le contexte associé au module selectionné 
	            			//Le nom du fichier est le nom du profil
	            			Ext.each(GEOR.config.CONTEXTS, function(context) {
        						if (context.title === moduleMetier) {
        							fileContext = context.wmc;
        							return;
        						}
	            			});
							//Si il n'y a pas de fichier correspondont, on prend le context par defaut
	            			if (fileContext === undefined) {
		            			Ext.each(storeData, function(data) {
            						if (data.title === "default" ) {
            							fileContext = data.wmc; 
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
};



