/*
 * Copyright (C) Camptocamp
 *
 * This file is part of geOrchestra
 *
 * geOrchestra is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with geOrchestra.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * @include OpenLayers/Control/ZoomToMaxExtent.js
 * @include OpenLayers/Control/ZoomIn.js
 * @include OpenLayers/Control/ZoomOut.js
 * @include OpenLayers/Control/DragPan.js
 * @include OpenLayers/Control/NavigationHistory.js
 * @include GeoExt/widgets/Action.js
 * @include GeoExt/widgets/LegendPanel.js
 * @requires GeoExt/widgets/WMSLegend.js
 * @include GeoExt/widgets/WMTSLegend.js
 * @include GEOR_workspace.js
 * @include GEOR_print.js
 * @include GEOR_config.js
 * @include GEOR_tools.js
 * @include GEOR_localStorage.js
 */

Ext.namespace("GEOR");

// see https://github.com/camptocamp/georchestra-geopicardie-configuration/issues/341
GeoExt.WMSLegend.prototype.defaultStyleIsFirst = false;

GEOR.geobuilder_toolbar = (function() {
    /*
     * Private
     */

    /**
     * Property: legendWin
     * {Ext.Tip} The tip containing the legend panel.
     */
    var legendWin = null;

    /**
     * Property: tr
     * {Function} an alias to OpenLayers.i18n
     */
    var tr = null;

    /**
     * Method: createTbar
     * Create the toolbar.
     *
     * Parameters:
     * layerStore - {GeoExt.data.LayerStore} The application's layer store.
     *
     * Returns:
     * {Ext.Toolbar} The toolbar.
     */
    var createTbar = function(layerStore) {
        var map = layerStore.map, tbar = new Ext.Toolbar({id: "tbar"}), ctrl, items = [];

        //Creation du menu de la toolbar
	 	
    	/**
    	 * Ajout du bouton Partager
    	 */	
    	//Method: shareLink
    	//Creates handlers for map link sharing
    	var shareLink = function(options) {
    	    return function() {
    	        GEOR.waiter.show();
    	        OpenLayers.Request.POST({
    	            url: GEOR.config.PATHNAME + "/ws/wmc/",
    	            data: GEOR.wmc.write({
    	            	title: ""
    	            }),
    	            success: function(response) {
    	            	var o = Ext.decode(response.responseText),
    	            	id =  /^.+(\w{32}).wmc$/.exec(o.filepath)[1];
    	            	var url = new Ext.XTemplate(options.url).apply({
    	            		"context_url": encodeURIComponent(GEOR.util.getValidURI(o.filepath)),
    	            		"map_url": GEOR.util.getValidURI('map/' + id),
    	            		"id": id
    	                });
    	                window.open(url);
    	            },
    	            scope: this
    	        });
    	    }
    	};
    	
    	//Creation de la liste du menu Partager
    	var getShareMenu = function() {
    	    var menu = [], cfg;
    	    Ext.each(GEOR.config.SEND_MAP_TO, function(item) {
    	        cfg = {
    	            text: tr(item.name),
    	            handler: shareLink.call(this, {
    	                url: item.url
    	            })
    	        };
    	        if (item.qtip) {
    	            cfg.qtip = tr(item.qtip);
    	        }
    	        if (item.iconCls) {
    	            cfg.iconCls = item.iconCls;
    	        }
    	        menu.push(cfg);
    	    });
    	    return menu;
    	};
    	 
    	items.push({
    		text: tr("Partager"),
    		menu: getShareMenu(),
    		iconCls: "geor-share"
    	});
    		
    	/**
    	 * Ajout du bouton Imprimer
    	 */
    	//Création d'un panel lors pour l'action du bouton d'impression
    	var legendPanel = new GeoExt.LegendPanel({
    	    layerStore:  map.layerStore,
    	    border: false,
    	    defaults: {
    	        labelCls: 'bold-text',
    		showTitle: true,
    		baseParams: {
    			FORMAT: 'image/png',
    			// geoserver specific:
    			LEGEND_OPTIONS: [
    			                 'forceLabels:on',
    			                 'fontAntiAliasing:true'
    			                 ].join(';')
    	        }
    	    },
    	    autoScroll: true
    	});	 
    	GEOR.print.setLegend(legendPanel);
    	
    	//Récupération du bouton impression
    	var print = GEOR.print.getAction();
    	//Ajout du text sur le bouton
    	print.setText(tr('Print'));
    	
    	
    	if(!GEOR.config.ANONYMOUS){
    		items.push(print);	
    	}
    	

    	
    	/**
    	 * Ajout du bouton Déplacement de la carte
    	 */
    	ctrl = new OpenLayers.Control();
    	items.push(new GeoExt.Action({
    	    control: ctrl,
    	    map: map,
    	    iconCls: "pan",
    	    tooltip: tr("pan"),
    	    toggleGroup: "map",
    	    allowDepress: false,
    	    pressed: true
    	}));     
    	
    	/**
    	 * Ajout d'une séparation par trait
    	 */	
    	items.push("-");
    	
    	/**
    	 * Ajout du bouton Zoom avant
    	 */
    	ctrl = new OpenLayers.Control.ZoomIn();
    	items.push(new GeoExt.Action({
    	    control: ctrl,
    	    map: map,
    	    iconCls: "zoomin",
    	    tooltip: tr("zoom in")
    	}));
    	
    	/**
    	 * Ajout du bouton Zoom arrière
    	 */
    	ctrl = new OpenLayers.Control.ZoomOut();
    	items.push(new GeoExt.Action({
    	    control: ctrl,
    	    map: map,
    	    iconCls: "zoomout",
    	    tooltip: tr("zoom out")
    	}));
    	
    	/**
    	 * Ajout d'une séparation par trait
    	 */
    	items.push("-");
    	 
    	/**
    	 * Ajout des boutons historique back et next
    	 */
    	ctrl = new OpenLayers.Control.NavigationHistory();
    	map.addControl(ctrl);
    	items.push(new GeoExt.Action({
    	    control: ctrl.previous,
    	    iconCls: "back",
    	    tooltip: tr("back to previous zoom"),
    	    disabled: true,
    	    hidden: true
    	}));
    	
    	items.push(new GeoExt.Action({
    	    control: ctrl.next,
    	    iconCls: "next",
    	    tooltip: tr("go to next zoom"),
    	    disabled: true,
    	    hidden: true
    	}));
    	
    	/**
    	 * Ajout d'une séparation par trait
    	 */
//    	items.push("-");
    	
    	/**
    	 * Ajout du bouton info
    	 */
    	items.push({
    	    xtype: 'button',
    	    iconCls: 'geor-btn-info',
    	    allowDepress: true,
    	    enableToggle: true,
    	    toggleGroup: 'map',
    	    tooltip: tr("Query all active layers"),
    	    listeners: {
    	    	"toggle": function(btn, pressed) {
    	            GEOR.getfeatureinfo.toggle(false, pressed);
    	        }
    	    }
    	});
    	
    	/**
    	 * Ajout d'une séparation justifié à droite
    	 */
    	items.push('->');
    	
    	/**
    	 * Ajout du bouton pour le menu Outils
    	 */
    	items.push(GEOR.tools.create());
    	
    	
    	/**
    	 * Ajout du bouton pour le menu Espace de travail
    	 */ 

    	//Création du bouton Espace de travail dont est issue le menu Partager
    	var workspace = GEOR.workspace.create(map);
    	
    	//On chercher le menu Partager
    	var share_array = workspace.menu.find('iconCls', "geor-share");
    	//On récupère le premièr élément
    	var share = share_array[0];
    	//On supprime le menu Partager du menu Workspace
    	workspace.menu.remove(share, true);
    	    	
    	items.push(workspace);

        items.push({
            text: tr("Legend"),
            tooltip: tr("Show legend"),
            enableToggle: true,
            handler: function(btn) {
                if (!legendWin) {
                    legendWin = new Ext.Window({
                        width: 340,
                        bodyStyle: 'padding: 5px',
                        constrainHeader: true,
                        title: tr("Legend"),
                        border: false,
                        animateTarget: GEOR.config.ANIMATE_WINDOWS && this.el,
                        layout: 'fit',
                        bodyCssClass: 'white-bg',
                        items: [ legendPanel ],
                        autoHeight: false,
                        height: 350,
                        closeAction: 'hide',
                        listeners: {
                            "hide": function() {
                                btn.toggle(false);
                            },
                            "show": function() {
                                btn.toggle(true);
                            }
                        },
                        autoScroll: true
                    });
                }
                if (!legendWin.isVisible()) {
                    legendWin.show();
                } else {
                    legendWin.hide();
                }
            }
        });

        // the toolbar items are added afterwards the creation of the toolbar
        // because we need a reference to the toolbar when creating the
        // legend item
        tbar.add.apply(tbar, items);
        return tbar;
    };



    /*
     * Public
     */
    return {

        /**
         * APIMethod: create
         * Return the toolbar config.
         *
         * Parameters:
         * layerStore - {GeoExt.data.LayerStore} The application's layer store.
         *
         * Returns:
         * {Ext.Toolbar} The toolbar.
         */
        create: function(layerStore) {
            Ext.QuickTips.init();
            tr = OpenLayers.i18n;

            return createTbar(layerStore);
        }
    };


})();
