Ext.namespace('WebGIS');
WebGIS.SearchAction = Ext.extend(Ext.Action, {

	url: null,
	baseParams: {},
	window: null,

	constructor: function(config) {
		this.url = config.url;
		if (config.hasOwnProperty('baseParams')) {
			this.baseParams = config.baseParams;
		}
		this.map = config.map;
		WebGIS.SearchAction.superclass.constructor.apply(this, arguments);
	},

	showSearchToolbar: function() {
		if (!this.window) {
			this.window = new Ext.Window({
				id: 'search-toolbar-window',
				flex: 1,
				layout: {
					type: 'vbox',
					pack: 'start'
				},
				resizable: false,
				closable: false,
				scrollable: false,
				listeners: {
					afterLayout: function(window, layout) {
						window.setHeight(window.getTopToolbar().getHeight()+window.getBottomToolbar().getHeight()+16+28*window.items.length);
						window.logicalOperator.setDisabled(window.items.length < 2);
					},
					beforeshow: function(window) {
						// calculate window's width from toolbar size
						var toolbar = window.getTopToolbar();
						var first_toolbar_item = toolbar.items.first();
						var last_toolbar_item = toolbar.items.last();
						var toolbar_width = last_toolbar_item.getPosition()[0]-first_toolbar_item.getPosition()[0]+last_toolbar_item.getWidth();
						window.setWidth(toolbar_width+2*(first_toolbar_item.getPosition()[0]-window.getPosition()[0]));
						if (window.items.length == 0) {
							window.addAttribute();
						}
					},
					render: function(window) {
						var map = new Ext.KeyMap(window.getEl(), [
							{
								key: [10, 13],
								fn: function() {
									window.search.handler.call(window.search.scope, window.search, Ext.EventObject);
								}
							}
						]);
					}
				},
				onLayerChanged: function(layer_record) {
					if (this.items.getCount() > 0) {
						// set attributes filters count to 1
						while(this.items.getCount() > 1) {
							this.remove(this.get(0));
						}
						this.doLayout();
						this.updateControlButtons();

						// clear first attribute value
						var attribs_store_data;
						if (layer_record) {
							attribs_store_data = layer_record.json;
						} else {
							attribs_store_data = {attributes: []};
						}
						var attributes_combo = this.items.first().attributeName;
						attributes_combo.store.loadData(attribs_store_data);
						attributes_combo.setValue('');
						attributes_combo.fireEvent('select', attributes_combo, null, -1);
					}
				},
				updateControlButtons: function() {
					if (this.items.getCount() == 1) {
						this.items.first().removeButton.hide();
						this.items.first().addButton.show();
					} else {
						this.items.each(function(attrib_item, index) {
							attrib_item.removeButton.show();
							attrib_item.addButton.hide();
						});
						this.items.last().addButton.show();
					}
				},
				addAttribute: function() {
					var layer_combo = this.activeLayer;
					var layer_item_index = layer_combo.getStore().find('name', layer_combo.getValue());
					var attributes_data;
					if (layer_item_index != -1) {
						attributes_data = layer_combo.getStore().getAt(layer_item_index).json;
					} else {
						attributes_data = {attributes: []};
					}
					this.add({
						xtype: 'container',
						width: this.getTopToolbar().getWidth(),
						height: 28,
						style: {
							padding: '3px 1px 3px 4px'
						},
						layout : {
							type: 'hbox',
							align : 'stretch'
						},
						items: [
							{
								xtype: 'combo',
								ref: 'attributeName',
								width: 150,
								editable: false,
								tooltip: gettext('Attribute'),
								mode: 'local',
								triggerAction: 'all',
								forceSelection: false,
								store: new Ext.data.JsonStore({
									data: attributes_data,
									storeId: 'search-attributes-store',
									root: 'attributes',
									fields: [{
										name: 'alias',
										type: 'string'
									}, {
										name: 'name',
										type: 'string'
									}, {
										name: 'type',
										type: 'string'
									}]
								}),
								valueField: 'name',
								displayField: 'alias',
								listeners: {
									afterrender: function(combo) {
										Ext.QuickTips.register({ target: combo.getEl(), text: combo.tooltip });
									},
									select: function (combo, record, index) {
										var operators_combo = combo.ownerCt.attributeOperator;
										if (!record) {
											operators_combo.store.loadData({operators: []});
											operators_combo.setValue('');
											operators_combo.fireEvent('select', operators_combo, null, -1);
											return;
										}
										var attrib_type = record.json['type'];
										if (combo.attrib_type == attrib_type && operators_combo.store.getCount() > 0) {
											// no need to update operators
											return;
										}
										combo.attrib_type = attrib_type;
										combo.ownerCt.valueField.setType(attrib_type);
										if (attrib_type == 'INTEGER' || attrib_type == 'DOUBLE') {
											operators = [
												{name: '=', value: '='},
												{name: '!=', value: '!='},
												{name: '<', value: '<'},
												{name: '<=', value: '<='},
												{name: '>', value: '>'},
												{name: '>=', value: '>='},
												{name: 'IN', value: 'IN'},
											]
										} else {
											operators = [
												{name: '=', value: '='},
												{name: '!=', value: '!='},
												{name: 'LIKE', value: 'LIKE'},
												{name: 'IN', value: 'IN'},
											]
										}
										operators_combo.store.loadData({operators: operators});
										if (operators_combo.getStore().getCount()) {
											var record = operators_combo.getStore().getAt(0);
											operators_combo.setValue(record.get('name'));
											operators_combo.fireEvent('select', operators_combo, record, 0);
										}
									}
								}
							}, {
								xtype: 'combo',
								ref: 'attributeOperator',
								width: 55,
								editable: false,
								tooltip: gettext('Comparison operator'),
								mode: 'local',
								triggerAction: 'all',
								forceSelection: true,
								store: new Ext.data.JsonStore({
									data: {operators: []},
									storeId: 'search-operator-store',
									root: 'operators',
									fields: [{
										name: 'name',
										type: 'string'
									}]
								}),
								valueField: 'name',
								displayField: 'name',
								listeners: {
									afterrender: function(combo) {
										Ext.QuickTips.register({ target: combo.getEl(), text: combo.tooltip });
									},
									select: function (combo, record, index) {
										var valueField = combo.ownerCt.valueField;
										if (record) {
											valueField.setMultiMode(record.get('name') == 'IN');
											valueField.get(0).setDisabled(false);
										} else {
											valueField.get(0).reset();
											valueField.get(0).setDisabled(true);
										}
									}
								}
							}, {
								xtype: 'container',
								ref: 'valueField',
								layout: 'fit',
								flex: 1,
								items: [{
									xtype: 'textfield',
									disabled: true
								}],
								setType: function(type) {
									this.multiMode = false;
									this.type = type;
									this.multiMode = false;
									this.createValueField();
								},
								setMultiMode: function(multi) {
									if (multi != this.multiMode) {
										this.multiMode = multi;
										this.createValueField();
									}
								},
								createValueField: function() {
									this.removeAll();
									var comp;
									if (this.type == 'INTEGER') {
										if (this.multiMode) {
											comp = {
												xtype: 'textfield',
												regex: /^\d+(\s*,\s*\d+)*$/,
												regexText: gettext('Incorrect value of comma-separated list of integers'),
												tooltip: gettext('Comma-separated list of integer numbers'),
												msgTarget: 'under'
											}
										} else {
											comp = {
												xtype: 'numberfield',
												allowDecimals: false,
												tooltip: gettext('Integer number')
											}
										}
									} else if (this.type == 'DOUBLE') {
										if (this.multiMode) {
											comp = {
												xtype: 'textfield',
												regex: /^\d+(\.\d+)?(\s*,\s*\d+(\.\d+)?)*$/,
												regexText: gettext('Incorrect value of comma-separated list of decimal numbers'),
												tooltip: gettext('Comma-separated list of decimal numbers'),
												msgTarget: 'under'
											}
										} else {
											comp = {
												xtype: 'numberfield',
												allowDecimals: true,
												decimalSeparator: '.',
												tooltip: gettext('Decimal number')
											}
										}
									} else {
										comp = {
											xtype: 'textfield',
											allowDecimals: false,
											tooltip: this.multiMode? gettext('Comma-separated list of text values') : gettext('Text value')
										}
									}
									comp.listeners = {
										afterrender: function(component) {
											Ext.QuickTips.register({ target: component.getEl(), text: component.tooltip });
										}
									};
									this.add(comp);
									this.doLayout();
								},
								getValue: function() {
									return this.get(0).getValue();
								}
							}, {
								xtype: 'container',
								itemId: 'control-buttons',
								layout: 'hbox',
								width: 38,
								cls: 'search-control-buttons',
								items: [
									{
										xtype: 'button',
										itemId: 'add-button',
										cls: 'x-btn-icon',
										iconCls: 'add-icon',
										tooltip: gettext('Add another attribute filter'),
										ref: './addButton',
										handler: function(button) {
											var search_window = button.ownerCt.ownerCt.ownerCt;
											search_window.addAttribute();
										}
									}, {
										xtype: 'box',
										flex: 1
									}, {
										xtype: 'button',
										itemId: 'remove-button',
										cls: 'x-btn-icon',
										iconCls: 'remove-icon',
										tooltip: gettext('Remove attribute filter'),
										ref: './removeButton',
										handler: function(button) {
											var window = button.ownerCt.ownerCt.ownerCt;
											// remove whole attribute container
											window.remove(button.ownerCt.ownerCt);
											search_window.updateControlButtons();
											window.doLayout();
										}
									}
								]
							}
						]
					});
					this.doLayout();
					this.updateControlButtons();
				},
				tbar: [
					{
						xtype: 'tbspacer'
					}, {
						xtype: 'combo',
						ref: '/activeLayer',
						width: 150,
						editable: false,
						tooltip: gettext('Layer'),
						mode: 'local',
						triggerAction: 'all',
						forceSelection: true,
						store: new Ext.data.JsonStore({
							data: {layers: []},
							storeId: 'search-layer-store',
							root: 'layers',
							fields: [{
								name: 'name',
								type: 'string'
							}]
						}),
						valueField: 'name',
						displayField: 'name',
						collectLayersData: function() {
							var layers_data = [];
							Ext.getCmp('layers-tree-panel').root.cascade(function(node) {
								if (node.isLeaf()) {
									var layer_config = node.attributes.config;
									if (layer_config.queryable && layer_config.type !== 'raster') {
										var attributes_data = [];
										Ext.each(layer_config.attributes, function(attribute) {
											attributes_data.push({
												alias: attribute.alias? attribute.alias : attribute.name,
												name: attribute.name,
												type: attribute.type,
											});
										});
										layers_data.push({
											name: layer_config.name,
											attributes: attributes_data
										});
									}
								}
							});
							this.layersData = layers_data;
						},
						updateLayersList: function(layers_list) {
							if (!this.layersData) {
								this.collectLayersData();
							}
							var available_layers = [];
							// filter available layers
							Ext.each(this.layersData, function(layer_data) {
								if (layers_list.indexOf(layer_data.name) != -1) {
									available_layers.push(layer_data);
								}
							});
							this.store.loadData({layers: available_layers});
							if (layers_list.indexOf(this.getValue()) == -1) {
								if (this.getStore().getCount() > 0) {
									var recordSelected = this.getStore().getAt(0);
									this.setValue(recordSelected.get('name'));
									this.fireEvent('select', this, recordSelected, 0);
								} else {
									this.setValue('');
									this.fireEvent('select', this, null, -1);
								}
							}
						},
						listeners: {
							afterrender: function(combo) {
								Ext.QuickTips.register({ target: combo.getEl(), text: combo.tooltip });
								var overlays_root = Ext.getCmp('layers-tree-panel').root;
								combo.updateLayersList(overlays_root.getVisibleLayers());
								overlays_root.on('layerchange', function(node, layer, visible_layers) {
									this.updateLayersList(visible_layers);
								}, combo);
							},
							select: function (combo, record, index) {
								search_window = Ext.getCmp('search-toolbar-window');
								search_window.onLayerChanged(record);
							}
						}
					}, {
						xtype: 'tbspacer'
					}, ' ', {
						xtype: 'label',
						text: gettext('Logical operator')+':'
					}, ' ', {
						xtype: 'tbspacer'
					}, {
						xtype: 'combo',
						ref: '/logicalOperator',
						width: 55,
						editable: false,
						mode: 'local',
						tooltip: gettext('Logical operator'),
						triggerAction: 'all',
						forceSelection: true,
						store: new Ext.data.ArrayStore({
							data: [['AND'], ['OR']],
							storeId: 'search-logical-operators-store',
							fields: [{
								name: 'value',
								type: 'string'
							}]
						}),
						valueField: 'value',
						displayField: 'value',
						listeners: {
							afterrender: function(combo) {
								Ext.QuickTips.register({ target: combo.getEl(), text: combo.tooltip });
								var recordSelected = combo.getStore().getAt(0);
								combo.setValue(recordSelected.get('value'));
							},
						}
					}, {
						xtype: 'tbspacer'
					}, ' ', {
						xtype: 'label',
						text: gettext('Limit')+':'
					}, ' ', {
						xtype: 'tbspacer'
					}, {
						xtype: 'spinnerfield',
						ref: '/limit',
						width: 55,
						mode: 'local',
						triggerAction: 'all',
						allowNegative: false,
						minValue: 1,
						maxValue: 1000,
						value: 50
					}, {
						xtype: 'tbspacer'
					}
				],
				bbar: [{
						xtype: 'checkbox',
						ref: '/restrictByExtent'
					}, {
						xtype: 'label',
						text: gettext('Restrict on visible area')
					}, '->', new Ext.Action({
						text: gettext('Search'),
						ref: '/search',
						tooltip: gettext('Search'),
						cls: 'x-btn-text',
						format: new OpenLayers.Format.GML({keepData: true}),
						firstElementChild: function(element) {
							if (element.children === undefined) {
								var childNodes = element.childNodes;
								for(var i = 0; i < childNodes.length; i += 1) {  // take every second element
									if (childNodes[i].nodeType === 1) {
										return childNodes[i];
									}
								}
								return children;
							} else {
								return element.children[0];
							}
						},
						scope: this,

						handler: function(action) {
							var search_window = this.window;
							var layer = search_window.activeLayer.getValue();
							var logical_operator = search_window.logicalOperator.getValue();
							var features_count = search_window.limit.getValue();
							var attributes_queries = [];
							search_window.items.each(function(attrib_item) {
								var attribute = attrib_item.attributeName.getValue();
								if (attribute) {
									var operator = attrib_item.attributeOperator.getValue();
									var value = attrib_item.valueField.getValue().toString();
									if (operator == 'IN') {
										// Format to proper list value string. Spaces are very important. Example: " ( 'val1' , 'val2' , ... ) "
										var list_values = [];
										Ext.each(value.split(','), function(list_value) {
											list_values.push(list_value.trim());
										});
										if (attrib_item.valueField.type == 'TEXT') {
											value = String.format(" ( '{0}' ) ", list_values.join("' , '"));
										} else {
											value = String.format(" ( {0} ) ", list_values.join(" , "));
										}
									} else if (operator == 'LIKE') {
										if (value.indexOf('%') == -1) {
											value = '%'+value+'%'
										}
										value = String.format("'{0}'", value);
									} else if (attrib_item.valueField.type == 'TEXT') {
										value = String.format("'{0}'", value);
									}
									attributes_queries.push(String.format('"{0}" {1} {2}', attribute, operator, value))
								}
							});

							var query_filter = String.format('{0}:{1}', layer, attributes_queries.join(String.format(' {0} ', logical_operator)));
							var query_params = {
								SERVICE: 'WMS',
								REQUEST: 'GetFeatureInfo',
								VERSION: '1.1.1',
								FEATURE_COUNT: features_count+1,
								INFO_FORMAT: 'application/vnd.ogc.gml',
								SRS: this.map.projection.projCode,
								LAYERS: layer,
								QUERY_LAYERS: layer,
								FILTER: query_filter,
							}
							Ext.apply(query_params, this.baseParams);
							if (search_window.restrictByExtent.getValue()) {
								query_params['BBOX'] = this.map.getExtent().toString();
							}
							Ext.Ajax.request({
								method: 'GET',
								url: this.url,
								params: query_params,
								scope: action,
								success: function(response, options) {
									var doc = response.responseXML;
									if(!doc || !doc.documentElement) {
										doc = response.responseText;
									}
									var features_panel = Ext.getCmp('featureinfo-panel');
									var features = this.format.read(doc);
									var bbox_node = this.firstElementChild(this.firstElementChild(this.format.data));
									var features_extent = this.format.parseGeometry["box"].apply(this.format, [bbox_node]);
									if (features.length == options.params.FEATURE_COUNT) {
										features.pop();
										features_panel.showFeatures(features, features_extent);
										var msg_template = gettext('More than %(count)s features are matching search condition');
										features_panel.setStatusInfo(interpolate(msg_template, {count: features.length}, true));
									} else {
										features_panel.showFeatures(features, features_extent);
									}
								},
								failure: function(response, opts) {
									Ext.MessageBox.show({
										title: gettext('Error'),
										msg: gettext('Searching failed'),
										minWidth: 300,
										closable: false,
										modal: true,
										buttons: Ext.Msg.OK,
									});
								}
							});
						}
					}
				)],
				items: []
			});
		}
		this.window.show();
		this.window.alignTo(Ext.getCmp('map-panel').getTopToolbar().getId(), 'tl-bl', [70, 0]);
	}
});
