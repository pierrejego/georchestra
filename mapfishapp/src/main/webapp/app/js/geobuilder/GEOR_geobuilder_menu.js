Ext.namespace("GEOR");

GEOR.geobuilder_initMenu = function (mapPanel) {	
	//Creation du menu geobuilder
	
	//Récupération du menu JSon
    var url = GEOR.config.GEOBUILDER_URL + GEOR.config.GEOBUILDER_CFM_MENU;
	Ext.Ajax.request
    ({
        url: url,
        method: 'GET',
        params: {},
        scope: this,
        success: function (response) {
        	if (response && response.responseText) {

        		//Creation du menu
	            var menuGeobuilder = new Ext.data.JsonStore({
	                // store configs
	                autoDestroy: true,
	                storeId: 'storeMenuGeobuilder',
	                // reader configs
	                root: 'WMENUS',
	                idProperty: 'ID',
	                fields: ['TABTYPE', 'TABURL', 'LIBELLE', 'WTYPE', 'ID', 'NIVEAU', 'WFRAME', 'TABPARAMS', 'ICONE']
	            });
	            
	            try{
		            var data = JSON.parse(response.responseText);
		            
		            if (data) {
		            	//Chargement du menu par les données retour de l'appel
			            menuGeobuilder.loadData(data);

			            //On cherche la position ou l'on doit insérer ce menu
			            var listeItems = mapPanel.getTopToolbar().items;
			            
			            var position;
			            for (var i = 0; i < listeItems.length; i++) {
			            	if (listeItems.items[i].getXType() === 'tbfill') {
			            		position = i + 1;
			            		break;
			            	}
			            }
			            
			            var nbVisible = parseInt(GEOR.config.GEOBUILDER_NB_ICONES);
			            
			            var menuDropDown = [];
			            var compteurItemVisible = 0;
			            
			            //Pour chaque menu geobuilder, on l'ajoute à la toolbar
			            //A partir du certain nombre de menu, on crée un menu Dropdown pour mettre la suite des menus Geobuilder
			            for (var i = 0; i < menuGeobuilder.getCount(); i++) {
			            	var type = menuGeobuilder.getAt(i).get("TABTYPE");
			            	if (type === "STAB" || type === "WTAB" || type === "BLNK" || type === "WKPL" ) {
			            		compteurItemVisible++;
				            	if (compteurItemVisible <= nbVisible) {
				            		mapPanel.getTopToolbar().insertButton(position, {
				            			id : 'menuItemGeobuilder'+compteurItemVisible,
				                    	xtype: 'button',
				                    	tooltip: menuGeobuilder.getAt(i).get("LIBELLE"),
				                    	icon: GEOR.config.GEOBUILDER_URL + GEOR.config.GEOBUILDER_REPO_IMAGES+ menuGeobuilder.getAt(i).get("ICONE"),
				                    	handler: GEOR.geobuilder_clickMenuHandler.createDelegate(this, [type, 
				            			                                                                             menuGeobuilder.getAt(i).get("TABURL"),
				            			                                                                             menuGeobuilder.getAt(i).get("LIBELLE")]),
				                    	scope: this
				                    });
					            	position++;
				            	} else if (compteurItemVisible > nbVisible) {
				            		menuDropDown.push({
				            			text: menuGeobuilder.getAt(i).get("LIBELLE"),
				            			icon: GEOR.config.GEOBUILDER_URL + GEOR.config.GEOBUILDER_REPO_IMAGES + menuGeobuilder.getAt(i).get("ICONE"),
				            			handler: GEOR.geobuilder_clickMenuHandler.createDelegate(this, [type, 
				            			                                                                             menuGeobuilder.getAt(i).get("TABURL"),
				            			                                                                             menuGeobuilder.getAt(i).get("LIBELLE")]),
				            			scope: this                			
				            		});
				            	}
			            	}
			            }
		                            
			            //Si le menu contient plus de 5 boutons, on crée un menu dropdown
			            if (compteurItemVisible > nbVisible) {
			            	mapPanel.getTopToolbar().insertButton(position, {
			            		id : 'menuItemGeobuilder'+ (nbVisible + 1),
			                    menu: menuDropDown
			        		});
			            }
			            		            
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

//Méthode appelée lors du clic d'un menu geobuilder
GEOR.geobuilder_clickMenuHandler = function(type, cfm, title){
	if (type === "STAB" || type === "WTAB") {		
		// Show spinner
		GEOR.waiter.show();
	
		// Change IRAME src attribute and select "Geobuilder" tab
		var tabPanel = Ext.getCmp('east-tabpanel');
		if (typeof Ext.getCmp('geobuilder-integration-tab') === "undefined") {
			GEOR.geobuilder_addGeobuilderTab();
		}
		var geobuilderTab = Ext.getCmp('geobuilder-integration-tab');
		tabPanel.setActiveTab(geobuilderTab);
		geobuilderTab.setTitle(title);
		var iframe = Ext.get(geobuilderTab.contentEl);
		iframe.dom.src = GEOR.config.GEOBUILDER_URL + cfm;
		iframe.dom.onload = function () {
			GEOR.waiter.hide();
		};
	} else if (type === "WKPL") {
		// Show spinner
		GEOR.waiter.show();

		var winWorkplace = Ext.getCmp('geo-window-workplace');
		if (!winWorkplace) {
			winWorkplace = GEOR.geobuilder_createWorkplaceWindow(title);
		}
		winWorkplace.show();
		var iframe = Ext.get(winWorkplace.contentEl);
		iframe.dom.src = GEOR.config.GEOBUILDER_URL + cfm;
		iframe.dom.onload = function () {
			GEOR.waiter.hide();
		};
	} else if (type === "BLNK") {
		window.open(GEOR.config.GEOBUILDER_URL + cfm);
	} 
};


GEOR.geobuilder_destroyMenu = function (mapPanel) {
	for (var i = 1; i <= parseInt(GEOR.config.GEOBUILDER_NB_ICONES) + 1; i++) {
		mapPanel.getTopToolbar().remove('menuItemGeobuilder'+i, true);
	}
};
