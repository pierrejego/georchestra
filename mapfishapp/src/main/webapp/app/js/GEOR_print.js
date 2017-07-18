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
 * @include GEOR_config.js
 * @include GEOR_util.js
 * @include GeoExt/widgets/MapPanel.js
 * @requires GeoExt/data/PrintProvider.js
 * @include GeoExt/data/PrintPage.js
 * @include GeoExt/plugins/PrintPageField.js
 * @include GeoExt/plugins/PrintProviderField.js
 * @include GeoExt/plugins/PrintExtent.js
 * @include OpenLayers/Format/GeoJSON.js
 * @include OpenLayers/Layer/Vector.js
 * @include OpenLayers/Feature/Vector.js
 * @include OpenLayers/StyleMap.js
 * @include OpenLayers/Style.js
 */
Ext.namespace("GEOR");

GEOR.print = (function() {

    /*
     * Private
     */

    /**
     * Property: mask
     * {Ext.LoadMask} The treePanel loadMask
     */
    var mask = null;

    /**
     * Property: win
     * {Ext.Window} The Ext window opened when the print
     * action triggers.
     */
    var win = null;

    /**
     * Property: action
     * {Ext.Action} The action.
     */
    var action = null;

    /**
     * Property: layerStore
     * {GeoExt.data.LayerStore} The layer store.
     */
    var layerStore = null;

    /**
     * Property: printProvider
     * {GeoExt.data.PrintProvider} The print provider.
     */
    var printProvider = null;

    /**
     * Property: printExtent
     * {GeoExt.plugins.PrintExtent} The print extent.
     */
    var printExtent;

    /**
     * property: printpage
     * {geoext.data.printpage} The print page.
     */
    var printPage = null;

    /**
     * property: legendPanel
     * {GeoExt.LegendPanel} The legend panel.
     */
    var legendPanel = null;

    /**
     * Property: tr
     * {Function} an alias to OpenLayers.i18n
     */
    var tr = null;

    /**
     * Property: boundsLayer
     * {OpenLayers.Layer.Vector} for print bounds
     */
    var boundsLayer;

    /**
     * Constant: VECTOR_LAYER_NAME
     * {String} The vector layer name, as used across this module
     */
    var VECTOR_LAYER_NAME = '__georchestra_print_bounds_';

    /**
     * property: defaultCustomParams
     * {Object} Default custom params for printPage.
     */
    var defaultCustomParams = {
        mapTitle: "",
        mapComments: "",
        copyright: "",
        scaleLbl: "",
        dateLbl: "",
        showOverview: true,
        showNorth: true,
        showScalebar: true,
        showDate: true,
        showLegend: true
    };

    /**
     * Method: getLayerSources
     * Creates an attribution string from map layers
     *
     * Parameters:
     * layerStore - {GeoExt.data.LayerStore} The application's layer store.
     *
     * Returns:
     * {String} The attribution string
     */
    var getLayerSources = function() {
        var attr = [];
        layerStore.each(function(r) {
            if (!r.get('attribution')) {
                return;
            }
            if (r.get('attribution').title && attr.indexOf(r.get('attribution').title) < 0) {
                attr.push(r.get('attribution').title);
            }
        });
        return ((attr.length > 1) ? tr("Sources: ") : tr("Source: ")) + attr.join(', ');
    };

    /**
     * Method: getProjection
     * Creates a string with the projection name
     *
     * Parameters:
     * layerStore - {GeoExt.data.LayerStore} The application's layer store.
     *
     * Returns:
     * {String} The projection string
     */
    var getProjection = function() {
        var s = '',
            epsg = layerStore.map.getProjection();
        proj = Proj4js.defs[epsg];
        if (!proj) {
            return '';
        }
        Ext.each(proj.split('+'), function(r) {
            var c = r.split("title=");
            if (c.length > 1) {
                s = c[1].replace(/,/g, '').trim();
            }
        });
        if (!s) {
            return '';
        }
        return tr("Projection: PROJ", {
            'PROJ': s
        });
    };

    /**
     * Method: initialize
     *
     * Initialize the print module.
     *
     * Parameters:
     * layerStore - {GeoExt.data.LayerStore} The application's layer store.
     */
    var initialize = function(ls) {

        layerStore = ls;
        tr = OpenLayers.i18n;
        boundsLayer = new OpenLayers.Layer.Vector(VECTOR_LAYER_NAME, {
            displayInLayerSwitcher: false,
            styleMap: new OpenLayers.StyleMap({
                "default": new OpenLayers.Style({
                    //fillColor: '#ee9900',
                    //fillOpacity: 0.25,
                    fillOpacity: 0,
                    strokeColor: "#000000",
                    strokeOpacity: 1,
                    strokeWidth: 2
                }),
                "temporary": new OpenLayers.Style({
                    fillColor: "#ffffff",
                    fillOpacity: 1,
                    strokeColor: "#000000",
                    strokeOpacity: 0.6,
                    strokeWidth: 1,
                    pointRadius: 5,
                    cursor: "${role}"
                }),
                "rotate": new OpenLayers.Style({
                    externalGraphic: GEOR.config.PATHNAME + "/app/img/print-rotate.png",
                    fillOpacity: 1.0,
                    graphicXOffset: 8,
                    graphicYOffset: 8,
                    graphicWidth: 20,
                    graphicHeight: 20,
                    cursor: "pointer",
                    display: "${display}",
                    rotation: "${rotation}"
                }, {
                    context: {
                        display: function(f) {
                            return f.attributes.role == "se-rotate" ? "" : "none";
                        },
                        rotation: function(f) {
                            return printPage.rotation;
                        }
                    }
                })
            })
        });

        // The printProvider that connects us to the print service
        var serviceUrl = GEOR.config.PATHNAME + '/pdf';
        GEOR.waiter.show(); // an XHR is required here for the print capabilities
        printProvider = new GeoExt.data.PrintProvider({
            url: serviceUrl,
            autoLoad: true,
            outputFormatsEnabled: true,
            baseParams: {
                url: serviceUrl
            },
            listeners: {
                "loadcapabilities": function(provider, caps) {
                    // Filter out layouts from the provider.layouts store
                    // that the current user does not have the right to use:
                    // see http://applis-bretagne.fr/redmine/issues/4497
                    provider.layouts.filterBy(function(record) {
                        var layout = record.get('name'),
                            acl = GEOR.config.PRINT_LAYOUTS_ACL[layout];
                        // empty or not specified means "layout allowed for everyone"
                        if (!acl || acl.length === 0) {
                            return true;
                        }
                        for (var i = 0, l = GEOR.config.ROLES.length; i < l; i++) {
                            // check current role is allowed to use current layout:
                            if (acl.indexOf(GEOR.config.ROLES[i]) >= 0) {
                                return true;
                            }
                        }
                        return false;
                    });
                    // create printPage & printExtent
                    printPage = new GeoExt.data.PrintPage({
                        printProvider: printProvider,
                        customParams: defaultCustomParams
                    });
                    printExtent = new GeoExt.plugins.PrintExtent({
                        layer: boundsLayer,
                        printProvider: printProvider,
                        transformFeatureOptions: {
                            rotationHandleSymbolizer: "rotate"
                        }
                    });
                    printExtent.init(GeoExt.MapPanel.guess());
                },
                "beforeencodelayer": function(printProvider, layer) {
                    if (layer.CLASS_NAME === "OpenLayers.Layer.Vector") {
                        if (layer.name === VECTOR_LAYER_NAME) {
                            // do not print bounds layer
                            return false;
                        }
                        var invalid = Ext.each(layer.features, GEOR.util.hasInvalidGeometry);
                        if (invalid >= 0) {
                            return false;
                        }
                    }
                },
                "beforeprint": function(provider, map, pages, o) {
                    mask.show();
                    pages[0].customParams.copyright = getLayerSources();
                    pages[0].customParams.projection = getProjection();
                    pages[0].customParams.scaleLbl = tr("Scale: ");
                    pages[0].customParams.dateLbl = tr("Date: ");
                    provider.customParams.showLegend = pages[0].customParams.showLegend;
                    // set a custom PDF file name:
                    provider.customParams.outputFilename = GEOR.config.PDF_FILENAME;
                },
                "print": function() {
                    mask.hide();
                },
                "printexception": function() {
                    mask.hide();
                    GEOR.util.errorDialog({
                        title: tr("Print error"),
                        msg: [
                            tr("Print server returned an error"),
                            tr("Contact platform administrator")
                        ].join('<br/>')
                    });
                },
                "encodelayer": function(pp, layer, encLayer) {
                    if (encLayer && encLayer.type === "WMTS") {
                        // FIXME: these values are incorrect and prevent printing of WMTS layers
                        delete encLayer['minScaleDenominator'];
                        delete encLayer['maxScaleDenominator'];
                    }
                    if (GEOR.config.WMSC2WMS.hasOwnProperty(layer.url)) {
                        if (GEOR.config.WMSC2WMS[layer.url] !== undefined) {
                            //console.log(layer.name + ' - tuilée avec WMS référencé'); // debug
                            encLayer.baseURL = GEOR.config.WMSC2WMS[layer.url];
                        } else {
                            //console.log(layer.name + ' - tuilée sans WMS référencé'); // debug
                            GEOR.util.infoDialog({
                                title: tr("Layer unavailable for printing"),
                                msg: [
                                    tr("The NAME layer cannot be printed.", {
                                        'NAME': layer.name
                                    }),
                                    tr("Contact platform administrator")
                                ].join('<br/>')
                            });
                        }
                    }
                }
            }
        });
    };

    /**
     * Method: formatHandler
     * Callback for checkHandler
     *
     * Parameters:
     * format - {String} The output format (eg: "png" or "pdf")
     */
    var formatHandler = function(format) {
        var r = printProvider.outputFormats.find("name", format);
        if (r >= 0) {
            printProvider.setOutputFormat(printProvider.outputFormats.getAt(r));
        } else {
            alert(tr("print.unknown.format", {
                'FORMAT': format
            }));
        }
    };

    /**
     * Method: showWindow
     *
     */
    var showWindow = function() {
        if (!printPage) {
            GEOR.util.errorDialog({
                title: tr("Unable to print"),
                msg: [
                    tr("The print server is currently unreachable"),
                    tr("Contact platform administrator")
                ].join('<br/>')
            });
            return;
        }
        if (win === null) {
            // default values from config:
            var r = printProvider.layouts.find("name",
                GEOR.config.DEFAULT_PRINT_LAYOUT);
            if (r >= 0) {
                printProvider.setLayout(printProvider.layouts.getAt(r));
            } else {
                alert(tr("print.unknown.layout", {
                    'LAYOUT': GEOR.config.DEFAULT_PRINT_LAYOUT
                }));
            }
            r = printProvider.dpis.find("value",
                GEOR.config.DEFAULT_PRINT_RESOLUTION);
            if (r >= 0) {
                printProvider.setDpi(printProvider.dpis.getAt(r));
            } else {
                alert(tr("print.unknown.resolution", {
                    'RESOLUTION': GEOR.config.DEFAULT_PRINT_RESOLUTION
                }));
            }
            // The form with fields controlling the print output
            var formPanel = new Ext.form.FormPanel({
                bodyStyle: "padding:5px",
                hideLabels: true,
                items: [{
                    xtype: 'textfield',
                    emptyText: tr("Title"),
                    width: 420,
                    name: 'mapTitle',
                    enableKeyEvents: true,
                    selectOnFocus: true,
                    plugins: new GeoExt.plugins.PrintPageField({
                        printPage: printPage
                    }),
                    listeners: {
                        "keypress": function(f, e) {
                            // transfer focus on Print button on ENTER
                            if (e.getKey() === e.ENTER) {
                                win.getFooterToolbar().getComponent('print').focus();
                            }
                        }
                    }
                }, {
                    xtype: 'textarea',
                    emptyText: tr("Comments"),
                    width: 420,
                    name: 'mapComments',
                    grow: false,
                    enableKeyEvents: false,
                    selectOnFocus: true,
                    plugins: new GeoExt.plugins.PrintPageField({
                        printPage: printPage
                    })
                }, {
                    xtype: 'hidden',
                    name: 'copyright',
                    plugins: new GeoExt.plugins.PrintPageField({
                        printPage: printPage
                    })
                }, {
                    xtype: 'hidden',
                    name: 'projection',
                    plugins: new GeoExt.plugins.PrintPageField({
                        printPage: printPage
                    })
                }, {
                    layout: 'column',
                    bodyStyle: 'padding:5px',
                    border: false,
                    items: [{
                        columnWidth: .5,
                        layout: 'form',
                        border: false,
                        labelAlign: 'left',
                        labelSeparator: tr("labelSeparator"),
                        labelWidth: 70,
                        items: [{
                                xtype: 'checkbox',
                                fieldLabel: tr("Minimap"),
                                name: 'showOverview',
                                checked: defaultCustomParams.showOverview,
                                plugins: new GeoExt.plugins.PrintPageField({
                                    printPage: printPage
                                })
                            },
                            /*{
                                                       xtype: 'checkbox',
                                                       fieldLabel: tr("North"),
                                                       name: 'showNorth',
                                                       checked: defaultCustomParams.showNorth,
                                                       plugins: new GeoExt.plugins.PrintPageField({
                                                           printPage: printPage
                                                       })
                                                   }, */
                            {
                                xtype: 'checkbox',
                                fieldLabel: tr("Scale"),
                                name: 'showScalebar',
                                checked: defaultCustomParams.showScalebar,
                                plugins: new GeoExt.plugins.PrintPageField({
                                    printPage: printPage
                                })
                            }, {
                                xtype: "combo",
                                store: printProvider.layouts,
                                lastQuery: '', // required to apply rights filter
                                displayField: "name",
                                valueField: "name",
                                fieldLabel: tr("Format"),
                                width: 110,
                                forceSelection: true,
                                editable: false,
                                mode: "local",
                                triggerAction: "all",
                                plugins: new GeoExt.plugins.PrintProviderField({
                                    printProvider: printProvider
                                })
                            }, {
                                xtype: "combo",
                                store: printProvider.dpis,
                                displayField: "name",
                                valueField: "value",
                                fieldLabel: tr("Resolution"),
                                width: 110,
                                forceSelection: true,
                                editable: false,
                                tpl: '<tpl for="."><div class="x-combo-list-item">{name} dpi</div></tpl>',
                                mode: "local",
                                triggerAction: "all",
                                plugins: new GeoExt.plugins.PrintProviderField({
                                    printProvider: printProvider
                                }),
                                // the plugin will work even if we modify a combo value
                                setValue: function(v) {
                                    var text = v;
                                    if (this.valueField) {
                                        var r = this.findRecord(this.valueField, v);
                                        if (r) {
                                            text = r.data[this.displayField];
                                        }
                                    }
                                    text = parseInt(v) + " dpi";
                                    this.lastSelectionText = text;
                                    Ext.form.ComboBox.superclass.setValue.call(this, text);
                                    this.value = v;
                                    return this;
                                }
                            }
                        ]
                    }, {
                        columnWidth: .5,
                        layout: 'form',
                        border: false,
                        labelAlign: 'left',
                        defaultType: 'textfield',
                        labelSeparator: tr("labelSeparator"),
                        labelWidth: 70,
                        items: [{
                            xtype: 'checkbox',
                            fieldLabel: tr("Date"),
                            name: 'showDate',
                            checked: defaultCustomParams.showDate,
                            plugins: new GeoExt.plugins.PrintPageField({
                                printPage: printPage
                            })
                        }, {
                            xtype: 'checkbox',
                            fieldLabel: tr("Legend"),
                            name: 'showLegend',
                            checked: defaultCustomParams.showLegend,
                            plugins: new GeoExt.plugins.PrintPageField({
                                printPage: printPage
                            })
                        }, {
                            xtype: "combo",
                            fieldLabel: tr("Scale"),
                            store: printProvider.scales,
                            forceSelection: true,
                            editable: false,
                            width: 110,
                            displayField: "name",
                            mode: "local",
                            triggerAction: "all",
                            plugins: new GeoExt.plugins.PrintPageField({
                                printPage: printPage
                            })
                        }, {
                            xtype: "numberfield",
                            fieldLabel: tr("Rotation"),
                            width: 110,
                            name: "rotation",
                            enableKeyEvents: true,
                            plugins: new GeoExt.plugins.PrintPageField({
                                printPage: printPage
                            })
                        }]
                    }]
                }]
            });

            win = new Ext.Window({
                title: tr("Print the map"),
                resizable: false,
                constrainHeader: true,
                animateTarget: GEOR.config.ANIMATE_WINDOWS && this.el,
                border: false,
                width: 450,
                x: 0,
                y: Ext.get(layerStore.map.div).getTop() + 1,
                autoHeight: true,
                closeAction: 'hide',
                items: [formPanel],
                listeners: {
                    "show": function() {
                        // show print extent:
                        // to fix black print extent issue - set the map of frame (layer.map) 
                        if (printExtent.layer) {
                            printExtent.layer.map = printExtent.map;
                        }
                        printExtent.addPage(printPage);
                        printExtent.show();
                        /*
                        // focus first field on show
                        var field = formPanel.getForm().findField('mapTitle');
                        field.focus('', 50);
                        */
                        var btn = win.getFooterToolbar().getComponent('print');
                        (function() {
                            btn.focus();
                        }).defer(50);
                    },
                    "hide": function() {
                        printExtent.removePage(printPage);
                        printExtent.hide();
                    }
                },
                buttons: [{
                    text: tr("Close"),
                    handler: function() {
                        win.hide();
                    }
                }, {
                    xtype: "splitbutton",
                    text: tr("Print"),
                    arrowTooltip: tr("Pick an output format"),
                    minWidth: 90,
                    itemId: 'print',
                    iconCls: 'mf-print-action',
                    handler: function() {
                        printProvider.print(layerStore.map, printPage, {
                            legend: legendPanel
                        });
                    },
                    menuAlign: "tr-br",
                    menu: new Ext.menu.Menu({
                        items: [{
                            checked: true,
                            group: 'print-format',
                            text: tr("PDF"),
                            checkHandler: formatHandler.createCallback("pdf")
                        }, {
                            checked: false,
                            group: 'print-format',
                            text: tr("PNG"),
                            checkHandler: formatHandler.createCallback("png")
                        }]
                    })
                }]
            });
        }
        win.show();

        if (!mask) {
            mask = new Ext.LoadMask(win.bwrap.dom, {
                msg: tr("Printing...")
            });
        }
    };

    /*
     * Public
     */
    return {

        /**
         * APIMethod: init
         * Initialize the print module
         *
         * Parameters:
         * layerStore - {GeoExt.data.LayerStore} The application's layer store.
         */
        init: function(layerStore) {
            initialize(layerStore);
        },

        /**
         * APIMethod: getAction
         * Get the print action (for inclusion in a toolbar).
         *
         * Returns:
         * {Ext.Action} The action.
         */
        getAction: function() {
            function setBtnLink(dataViewer, button, input) {
                // apply image as externalGraphic symbol
                var format;
                var value;
                var link;
                button = Ext.getCmp("printLogo");
                input = Ext.getCmp("inputImg");
                if (dataViewer.getSelectedRecords().length > 0) {
                    // get logo value & url
                    value = dataViewer.getSelectedRecords()[0].data.name;
                    link = dataViewer.getSelectedRecords()[0].data.url;

                } else {
                    value = OpenLayers.i18n("Load");
                    link = "";
                }
                if (button && input) {
                    // display logo name
                    button.setText(value);
                    // insert url in hidden input
                    input.setValue(link);
                }
            }

            if (action === null) {
                action = new Ext.Action({
                    xtype: "splitbutton",
                    iconCls: 'mf-print-action',
                    text: 'Impression',
                    tooltip: OpenLayers.i18n("Print current map"),
                    menu: new Ext.menu.Menu({
                        items: [{
                                text: "Standard",
                                tooltip: OpenLayers.i18n("Print current map"),
                                iconCls: 'mf-print-action',
                                handler: showWindow,
                            },
                            {
                                text: OpenLayers.i18n("Advanced"),
                                iconCls: "mf-print-advanced",
                                tooltip: OpenLayers.i18n("Advanced layout"),
                                handler: function() {
                                    var subDirName = [],
                                        subDir = [],
                                        rootName = "",
                                        subDirFiles = [],
                                        filesInRoot = [],
                                        libWindow = "",
                                        logoUrl = "",
                                        inputImg,
                                        updateView,
                                        pictureBtn;
                                    // get url use in pictures library
                                    var jsonFileUrl = GEOR.custom.URL_PRINT_DATAVIEW ? GEOR.custom.URL_PRINT_DATAVIEW : "";

                                    // create picture library
                                    var createLibWindow = function() {

                                        var cleanTree = function(node) {
                                            while (node.firstChild) {
                                                node.removeChild(node.firstChild);
                                            }
                                        };

                                        var tpl = new Ext.XTemplate(
                                            '<tpl for=".">',
                                            '<div class="thumb-wrap" id="{name}">',
                                            '<div class="thumbStyle"><img src="{url}" title="{name}"></div>',
                                            '</div>',
                                            '</tpl>',
                                            '<div class="x-clear"></div>'
                                        );
                                        // create dataview
                                        var dataViewStyler = new Ext.DataView({
                                            store: new Ext.data.JsonStore({
                                                fields: [{
                                                    name: "url",
                                                    convert: function(v, rec) {
                                                        return rec
                                                    }
                                                }, {
                                                    name: "name",
                                                    convert: function(v, rec) {
                                                        var first = rec.lastIndexOf("/") + 1;
                                                        var recLen = rec.length;
                                                        // get name and format to display
                                                        var recName = rec.substring(first, recLen);
                                                        return recName;
                                                    }

                                                }]
                                            }),
                                            id: 'print_dataView',
                                            multiSelect: false,
                                            singleSelect: true,
                                            tpl: tpl,
                                            overClass: 'x-view-over',
                                            itemSelector: 'div.thumb-wrap',
                                            emptyText: OpenLayers.i18n("No data"),
                                            listeners: {
                                                "selectionChange": function(a, selected) {
                                                    var btn = Ext.getCmp("button-applyDataViewer");
                                                    if (selected.length > 0) {
                                                        btn.enable();
                                                    } else {
                                                        if (!btn.disabled) {
                                                            btn.disable();
                                                        }
                                                    }
                                                }
                                            }
                                        });

                                        // create tree panel
                                        var tree = new Ext.tree.TreePanel({
                                            // tree
                                            animate: true,
                                            id: "treePrint",
                                            resizable: true,
                                            enableDD: false,
                                            autoScroll: true,
                                            ddGroup: 'organizerDD',
                                            rootVisible: true,
                                            // layout
                                            region: 'west',
                                            boxMinWidth: 130
                                        });

                                        // create first root node
                                        var root = new Ext.tree.TreeNode({
                                            text: OpenLayers.i18n("Logo"),
                                            expanded: false,
                                            expandable: false,
                                            allowDrag: false,
                                            allowDrop: false,
                                            listeners: {
                                                click: function(node) {
                                                    updateView(node, logoUrl);
                                                    root.childNodes.forEach(function(item, index) {
                                                        item.setCls("album-node");
                                                    });
                                                },
                                                expand: function() {
                                                    Ext.getCmp("dataViewStylerPanel").doLayout();
                                                },
                                                collapse: function() {
                                                    Ext.getCmp("dataViewStylerPanel").doLayout();
                                                }
                                            }
                                        });

                                        tree.setRootNode(root);

                                        // to clean all tree
                                        var cleanTree = function(node) {
                                            while (node.firstChild) {
                                                node.removeChild(node.firstChild);
                                            }
                                        };

                                        // create update function to get nodes names and subfiles
                                        var updateTree = function() {
                                            // function to create nodes if not already exist
                                            function createNode(array, dirName) {
                                                array.push(dirName);
                                                root.appendChild(
                                                    new Ext.tree.TreeNode({
                                                        text: dirName,
                                                        cls: 'album-node',
                                                        allowDrag: false,
                                                        listeners: {
                                                            click: function(node) {
                                                                root.childNodes.forEach(function(item, index) {
                                                                    item.setCls("album-node");
                                                                });
                                                                node.setCls("album-node-open");
                                                                updateView(node, logoUrl);
                                                            }
                                                        }
                                                    })
                                                );
                                            }

                                            // clean tree nodes and others data
                                            cleanTree(tree.root);
                                            subDir = [];
                                            filesInRoot = [];
                                            subDirName = [];
                                            subDirFiles = [];

                                            dataViewStyler.getStore().removeAll();

                                            // create ajax Request to get information from logo directory            		
                                            var xhttp = new XMLHttpRequest();

                                            // treat xhttp response
                                            xhttp.onreadystatechange = function() {

                                                if (this.readyState == 4 && this.status == 200) {
                                                    var decodeJson = JSON.parse(this.responseText);
                                                    // set new root name
                                                    rootName = Object.keys(decodeJson)[0]
                                                    root.setText(rootName);

                                                    // parse response to get nodes and according files
                                                    var result = decodeJson[rootName];

                                                    for (i = 0; i < result.length; i++) {
                                                        // get file name or directory name
                                                        var elem = result[i];
                                                        var key = Object.keys(elem);
                                                        // value of key is sub directory name or just json param's file
                                                        var keyStr = key[0]

                                                        // get value of param file directly, so it's file name if not array or list of files in sub directory
                                                        var content = elem[keyStr];
                                                        // if two "/" it's subdirectory file like root/subdirectory/file
                                                        var countOccurency = (content.match(/\//g) || []).length;
                                                        var fstSlash = content.indexOf("/") + 1;
                                                        // name beautifier without "/"
                                                        content = content.substring(fstSlash, content.length);

                                                        // file in root directory or in sub directory
                                                        if (countOccurency == 1) {
                                                            filesInRoot.push(content);
                                                        } else {
                                                            // create node
                                                            if (countOccurency == 2) {
                                                                subDirFiles.push(content);
                                                                var scndSlash = content.indexOf("/");
                                                                var dirName = content.substring(0, scndSlash);
                                                                var exist = false;
                                                                // create node if not exist   							    							
                                                                if (subDirName.length < 1 || subDirName.indexOf(dirName) < 0) {
                                                                    createNode(subDirName, dirName);
                                                                }
                                                            }
                                                        }
                                                    }

                                                    // get root directory URL from 
                                                    if (jsonFileUrl.lastIndexOf("/") > -1) {
                                                        logoUrl = jsonFileUrl.substring(0, jsonFileUrl.lastIndexOf("/")) + "/" + rootName;
                                                    }

                                                    // Display img from root directory when window is show
                                                    if (root && logoUrl != "") {
                                                        updateView(root, logoUrl);
                                                    }

                                                } else {
                                                    if (this.readyState === 4 && this.status !== 200) {
                                                        console.log("Error", this.statusText)
                                                    }
                                                }
                                            };

                                            // request params
                                            xhttp.open("GET", jsonFileUrl, true);
                                            // fire request
                                            xhttp.send();
                                        };

                                        // request to load dataView store with root files
                                        updateView = function(node, url) {
                                            // test if node is the root directory, else it's simple node
                                            if (node.isRoot) {
                                                // so get all files concat with url option and push data to dataView store
                                                if (filesInRoot && filesInRoot.length > 0) {
                                                    var dataRoot = [];
                                                    filesInRoot.forEach(function(item, index) {
                                                        dataRoot.push(url + "/" + item);
                                                    });
                                                    dataViewStyler.getStore().loadData(dataRoot);
                                                }
                                                // else, find name in sub directory array and display according files
                                            } else {
                                                if (node.text) {
                                                    var dataSub;
                                                    var dirName;
                                                    var filesArray = [];
                                                    // match subdirectory's name and get according files name
                                                    subDirFiles.forEach(function(item, index) {
                                                        if (item.indexOf(node.text) > -1) {
                                                            filesArray.push(url + "/" + item);
                                                        }
                                                    });
                                                    dataViewStyler.getStore().loadData(filesArray);
                                                }
                                            }
                                        };

                                        // create external symbol window
                                        libWindow = new Ext.Window({
                                            title: OpenLayers.i18n("Symbol Library"),
                                            id: "printLogoWindow",
                                            layout: 'border',
                                            modal: true,
                                            width: 300,
                                            minWidth: 100,
                                            boxMinHeight: 230,
                                            autoScroll: true,
                                            modal: true,
                                            resizable: true,
                                            closeAction: 'hide',
                                            constrainHeader: true,
                                            listeners: {
                                                show: function() {
                                                    updateTree();
                                                    libWindow.restore();
                                                }
                                            },
                                            items: [tree, {
                                                region: 'center',
                                                split: true,
                                                autoScroll: true,
                                                id: "dataViewStylerPanel",
                                                items: [dataViewStyler]
                                            }],
                                            buttons: [{
                                                text: OpenLayers.i18n("Load"),
                                                id: "button-applyDataViewer",
                                                disabled: true,
                                                listeners: {
                                                    afterrender: function() {
                                                        libWindow.syncSize();
                                                    },
                                                    click: function() {
                                                        setBtnLink(dataViewStyler, pictureBtn, inputImg);
                                                    }
                                                }
                                            }, {
                                                text: OpenLayers.i18n("Close"),
                                                handler: function() {
                                                    setBtnLink(dataViewStyler, pictureBtn, inputImg);
                                                    libWindow.close();
                                                }
                                            }]
                                        });
                                        return libWindow.show();
                                    };

                                    // Create radio group to select print format
                                    var format = new Ext.form.RadioGroup({
                                        fieldLabel: "Format ",
                                        items: [{
                                                boxLabel: "A4",
                                                name: "rb-size",
                                                inputValue: "A4",
                                                checked: true
                                            },
                                            {
                                                boxLabel: "A3",
                                                name: "rb-size",
                                                inputValue: "A3",
                                                checked: false
                                            }
                                        ]
                                    });

                                    // Create radio group to select orientation
                                    var orientation = new Ext.form.RadioGroup({
                                        fieldLabel: "Orientation ",
                                        items: [{
                                                boxLabel: "Portrait",
                                                name: "rb-format",
                                                inputValue: "portrait",
                                                checked: true
                                            },
                                            {
                                                boxLabel: OpenLayers.i18n("Landscape"),
                                                name: "rb-format",
                                                inputValue: "landscape",
                                                checked: false
                                            }
                                        ]
                                    });

                                    // button to display logo dataview
                                    pictureBtn = new Ext.Button({
                                        text: OpenLayers.i18n("Load"),
                                        id: "printLogo",
                                        tooltip: OpenLayers.i18n("Load external picture"),
                                        iconCls: "printLogoStyle",
                                        cls: "print-load-button",
                                        handler: function() {
                                            if (jsonFileUrl) {
                                                if (Ext.getCmp("print_libWindow")) {
                                                    Ext.getCmp("print_libWindow").close();
                                                } else {
                                                    createLibWindow();
                                                }
                                            }

                                        }
                                    });

                                    // display button
                                    var cpImg = new Ext.form.CompositeField({
                                        fieldLabel: OpenLayers.i18n("Logo"),
                                        items: [pictureBtn,
                                            {
                                                xtype: "textfield",
                                                id: "inputImg",
                                                hidden: true,
                                                cls: "imput-image"
                                            }
                                        ]
                                    });

                                    if (Ext.getCmp("win_advancedPrint")) {
                                        Ext.getCmp("win_advancedPrint").destroy();
                                    }

                                    // window to param advanced print
                                    var paramWin = new Ext.Window({
                                        id: "win_advPrint",
                                        shadow: false,
                                        title: OpenLayers.i18n("Advanced layout"),
                                        closeAction: "close",
                                        buttonAlign: "center",
                                        width: 450,
                                        autoHeight: true,
                                        buttons: [{
                                            text: OpenLayers.i18n("Print"),
                                            handler: function() {
                                                var val = []; // result after loop is ["A4", "portrait"]
                                                format.items.items.forEach(function(el) {
                                                    if (el.checked) {
                                                        val.push(el.inputValue);
                                                    }
                                                });
                                                orientation.items.items.forEach(function(el) {
                                                    if (el.checked) {
                                                        val.push(el.inputValue);
                                                    }
                                                });
                                                // find document on apache for checked radio
                                                var str = val.join("_"); // return string like "A4_portrait"
                                                var fileName = "print_" + str + ".html"; // fint document as print_A4_portrait.html on server
                                                // get screen width and hieght to set open window size
                                                var screenHeight = screen.height;
                                                var screenWidth = screen.width;
                                                var winHeight = screenHeight * 0.70;
                                                var winWidth = winHeight * 0.7;
                                                var size = "height=" + winHeight + "; width=" + winWidth + ";";
                                                // open print document in new window                                                                                                // open print document in new window
                                                if(GEOR.custom.URL_PRINT_DOC){
                                                    window.open(GEOR.custom.URL_PRINT_DOC + fileName,"", size);
                                                }

                                            }
                                        }],
                                        items: [{
                                            xtype: "panel",
                                            id: "pan_advPrint",
                                            items: [{
                                                xtype: "fieldset",
                                                id: "fset_advPrint",
                                                autoHeight: true,
                                                items: [format, orientation, cpImg]
                                            }]
                                        }]
                                    });
                                    paramWin.show();
                                }
                            }
                        ]
                    })
                });
            }
            return action;
        },

        /**
         * APIMethod: setLegend
         * Set the legend panel
         *
         * Parameters:
         * l - {GeoExt.LegendPanel} the legend panel
         */
        setLegend: function(l) {
            legendPanel = l;
        }
    };
})();


GeoExt.data.PrintProvider.prototype.encoders.legends["gx_vectorlegend"] = function(legend) {
    var enc = this.encoders.legends.base.call(this, legend);
    enc[0].classes.push({
        name: ""
    });
    return enc;
};