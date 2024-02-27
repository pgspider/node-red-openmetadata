'use strict';

/* Information of each API
	'API_name': {
		segment: path to resource
		pathParamname: name of path parameter
		listQueryParamname: list query parameters
	}
*/
const resourceInfo = {
	'search_entities': {
		segment: 'search/query',
		listQueryParamname: ['q', 'index', 'deleted', 'from', 'size', 'sort_field', 'sort_order',
			'track_total_hits', 'query_filter', 'post_filter', 'fetch_source']
	},
	'list_database_services': {
		segment: 'services/databaseServices',
		listQueryParamname: ['fields', 'domain', 'limit', 'before', 'after', 'include']
	},
	'get_database_service_by_name': {
		segment: 'services/databaseServices/name/{name}',
		pathParamname: 'name',
		listQueryParamname: ['fields', 'include']
	},
	'get_a_database_service': {
		segment: 'services/databaseServices/{id_param}',
		pathParamname: 'id_param',
		listQueryParamname: ['fields', 'include']
	},
	'list_databases': {
		segment: 'databases',
		listQueryParamname: ['fields', 'service', 'limit', 'before', 'after', 'include']
	},
	'get_a_database_by_id': {
		segment: 'databases/{id_param}',
		pathParamname: 'id_param',
		listQueryParamname: ['fields', 'include']
	},
	'list_database_schemas': {
		segment: 'databaseSchemas',
		listQueryParamname: ['fields', 'database', 'limit', 'before', 'after', 'include']
	},
	'get_a_schema_by_id': {
		segment: 'databaseSchemas/{id_param}',
		pathParamname: 'id_param',
		listQueryParamname: ['fields', 'include']
	},
	'list_tags': {
		segment: 'tags',
		listQueryParamname: ['parent', 'fields', 'disabled', 'limit', 'before', 'after', 'include']
	},
	'list_tables': {
		segment: 'tables',
		listQueryParamname: ['fields', 'database', 'databaseSchema', 'includeEmptyTestSuite',
			'limit', 'before', 'after', 'include']
	},
	'list_of_column_profiles': {
		segment: 'tables/{fqn}/columnProfile',
		pathParamname: 'fqn',
		listQueryParamname: ['startTs', 'endTs']
	},
	'list_of_table_profiles': {
		segment: 'tables/{fqn}/tableProfile',
		pathParamname: 'fqn',
		listQueryParamname: ['startTs', 'endTs']
	},
	'get_a_table_by_id': {
		segment: 'tables/{id_param}',
		pathParamname: 'id_param',
		listQueryParamname: ['fields', 'include']
	},
	'get_sample_data': {
		segment: 'tables/{id_param}/sampleData',
		pathParamname: 'id_param',
	}
};

module.exports = function (RED) {
	async function callAPI(url, method, token, body, config) {
		const { got } = await import('got');
		const { HttpProxyAgent, HttpsProxyAgent } = require('hpagent');

		let prox, noprox;
		let noproxy = false;
		if (config.noproxy == true) {
			noproxy = true;
		} else if (getField(config, null, config.proxyFieldType, config.proxy) !== '') {
			prox = getField(config, null, config.proxyFieldType, config.proxy)
		} else {
			if (process.env.HTTP_PROXY) { prox = process.env.HTTP_PROXY; }
			if (process.env.http_proxy) { prox = process.env.http_proxy; }
			if (process.env.NO_PROXY) { noprox = process.env.NO_PROXY.split(","); }
			if (process.env.no_proxy) { noprox = process.env.no_proxy.split(","); }
		}
		if (noprox) {
			for (var i = 0; i < noprox.length; i += 1) {
				if (getField(config, null, config.endpointFieldType, config.endpoint).indexOf(noprox[i]) !== -1) {
					noproxy = true;
				}
			}
		}

		let opts = {};
		opts.timeout = { request: 5000 };
		opts.throwHttpErrors = false;
		opts.decompress = false;
		opts.method = method;
		opts.retry = { limit: 0 };
		opts.responseType = 'buffer';
		opts.maxRedirects = 21;
		opts.ignoreInvalidCookies = true;

		opts.headers = {};
		if (body !== undefined) {
			opts.body = JSON.stringify(body);
			opts.headers['content-type'] = 'application/json';
			opts.headers['content-length'] = opts.body.length;
		}
		if (token !== undefined) {
			opts.headers.Authorization = 'Bearer ' + token;
		}

		if (prox && !noproxy) {
			let proxyURL = new URL(prox);
			let proxyOptions = {
				proxy: {
					protocol: proxyURL.protocol,
					hostname: proxyURL.hostname,
					port: proxyURL.port,
					username: null,
					password: null
				},
				maxFreeSockets: 256,
				maxSockets: 256,
				keepAlive: true
			}

			if (proxyURL.username && proxyURL.password) {
				proxyOptions.proxy.username = proxyURL.username
				proxyOptions.proxy.password = proxyURL.password
			}

			opts.agent = {
				http: new HttpProxyAgent(proxyOptions),
				https: new HttpsProxyAgent(proxyOptions)
			}
		}

		return new Promise((resolve, reject) => {
			let response = {};
			got(url, opts).then(res => {
				response.statusCode = res.statusCode;
				response.headers = res.headers;
				response.responseUrl = res.url;
				response.body = res.body.toString('utf8');
				response.retry = 0;
				resolve(response);
			}).catch(err => {
				reject(err);
			});
		});
	}

	function getField(node, msg, kind, value) {
		switch (kind) {
			case 'msg':
				return msg[value];
			case 'flow':
				return node.context().flow.get(value);
			case 'global':
				return node.context().global.get(value);
			case 'num':
				return parseInt(value);
			case 'str':
				return value;
			case 'env':
				return process.env[value];
			default:
				return value;
		}
	}

	/* Logout from OpenMetadata and return a node name if done */
	function Logout(config) {
		return new Promise(async (resolve, reject) => {
			if (config.needLogout) {
				let url = getField(config, null, config.endpointFieldType, config.endpoint);
				if (url.slice(-1) !== '/') {
					url += '/';
				}
				url += 'users/logout';
				let body = {
					token: config.token
				};
				try {
					const response = await callAPI(url, 'POST', config.token, body, config);
					if (response.statusCode == 200){
						config.needLogout = false;
						resolve(config.name);
					}
					else {
						var err = `API error ${response.statusCode}: ${body.message}`;
						throw err;
					}
				} catch (err) {
					reject(err);
				}
			} else {
				resolve('');
			}
		});
	}

	function OpenMetadataConfigNode(config) {
		const node = this;
		RED.nodes.createNode(node, config);
		node.name = config.name;
		node.needLogout = config.needLogout;
		node.endpoint = config.endpoint;
		node.endpointFieldType = config.endpointFieldType;
		node.user = config.user;
		node.userFieldType = config.userFieldType;
		node.password = config.password;
		node.passwordFieldType = config.passwordFieldType;
		node.tokenInput = config.tokenInput;
		node.tokenInputFieldType = config.tokenInputFieldType;
		node.proxy = config.proxy;
		node.proxyFieldType = config.proxyFieldType;
		node.noproxy = config.noproxy;

		/* Logout from OpenMetadata when the config node is destroyed */
		this.on('close', function (done) {
			Logout(node).then(response => {
				if (response !== '') {
					node.log('Logout ' + response);
				}
				done();
			}).catch(err => {
				node.error(err.message);
			});
		});
	}

	RED.nodes.registerType('openMetadataConfig', OpenMetadataConfigNode);

	function OpenMetadataNode(config) {
		const node = this;
		RED.nodes.createNode(node, config);
		node.resource = config.resource;
		node.q = config.q;
		node.qFieldType = config.qFieldType;
		node.name = config.name;
		node.nameFieldType = config.nameFieldType;
		node.id_param = config.id_param;
		node.id_paramFieldType = config.id_paramFieldType;
		node.fqn = config.fqn;
		node.fqnFieldType = config.fqnFieldType;
		node.startTs = config.startTs;
		node.startTsFieldType = config.startTsFieldType;
		node.endTs = config.endTs;
		node.endTsFieldType = config.endTsFieldType;
		node.index = config.index;
		node.indexFieldType = config.indexFieldType;
		node.deleted = config.deleted;
		node.deletedFieldType = config.deletedFieldType;
		node.from = config.from;
		node.fromFieldType = config.fromFieldType;
		node.name = config.name;
		node.nameFieldType = config.nameFieldType;
		node.size = config.size;
		node.sizeFieldType = config.sizeFieldType;
		node.sort_field = config.sort_field;
		node.sort_fieldFieldType = config.sort_fieldFieldType;
		node.sort_order = config.sort_order;
		node.sort_orderFieldType = config.sort_orderFieldType;
		node.track_total_hits = config.track_total_hits;
		node.track_total_hitsFieldType = config.track_total_hitsFieldType;
		node.query_filter = config.query_filter;
		node.query_filterFieldType = config.query_filterFieldType;
		node.post_filter = config.post_filter;
		node.post_filterFieldType = config.post_filterFieldType;
		node.fetch_source = config.fetch_source;
		node.fetch_sourceFieldType = config.fetch_sourceFieldType;
		node.include_source_fields = config.include_source_fields;
		node.include_source_fieldsFieldType = config.include_source_fieldsFieldType;
		node.parent = config.parent;
		node.parentFieldType = config.parentFieldType;
		node.fields = config.fields;
		node.fieldsFieldType = config.fieldsFieldType;
		node.domain = config.domain;
		node.domainFieldType = config.domainFieldType;
		node.service = config.service;
		node.serviceFieldType = config.serviceFieldType;
		node.database = config.database;
		node.databaseFieldType = config.databaseFieldType;
		node.disabled = config.disabled;
		node.disabledFieldType = config.disabledFieldType;
		node.databaseSchema = config.databaseSchema;
		node.databaseSchemaFieldType = config.databaseSchemaFieldType;
		node.includeEmptyTestSuite = config.includeEmptyTestSuite;
		node.limit = config.limit;
		node.limitFieldType = config.limitFieldType;
		node.before = config.before;
		node.beforeFieldType = config.beforeFieldType;
		node.after = config.after;
		node.afterFieldType = config.afterFieldType;
		node.include = config.include;
		node.includeFieldType = config.includeFieldType;
		node.config = RED.nodes.getNode(config.openMetadataConfig);

		/* Get value of parameter depend on its datatype */
		const getValueParamname = (node, msg, paramname) => {
			let valueParamname = undefined;
			let { [paramname]: valueParam } = node;
			if (valueParam != '') {
				let { [paramname + 'FieldType']: paramType } = node;
				valueParamname = getField(node, msg, paramType, valueParam);
			}
			return valueParamname;
		}

		const appendParamNew = ({
			url,
			msg,
			segment = '',
			pathParamname = '',
			listQueryParamname = []
		}) => {
			/* Replace path paramname by its value to construct url */
			if (pathParamname) {
				segment = segment.replaceAll(
					`{${pathParamname}}`,
					getValueParamname(node, msg, pathParamname))
			}
			url = `${url}${segment}`;
			let listQueryObj = {};

			listQueryParamname.forEach((paramnameQuery) => {
				const valueQuery = getValueParamname(node, msg, paramnameQuery);
				if (valueQuery != undefined) {
					listQueryObj = {
						...listQueryObj,
						[paramnameQuery]: valueQuery
					}
				}
			})

			/* Append query parameter */
			if (Object.keys(listQueryObj).length > 0) {
				url += '?' + new URLSearchParams(listQueryObj).toString();
			}
			return url;
		}

		function reportError(err, msg, done) {
			if (err) {
				if (done) {
					// Node-RED 1.0 compatible
					done(err);
				} else {
					// Node-RED 0.x compatible
					node.error(err, msg);
				}
			}
		}

		/* Return accessToken.
		 * If token is already acquired, it is reused.
		 * If token is specified by user on ConfigNode, it is returned.
		 * Else, login to OpenMetadata and pickup accessToken in the response.
		 */
		function GetToken(node) {
			return new Promise(async (resolve, reject) => {
				if (node.config.token === undefined) {
					let tokenInput = getField(node, null, node.config.tokenInputFieldType, node.config.tokenInput);
					if (!tokenInput) {
						/* Login to OpenMetadata with email and password  */
						let url = getField(node, null, node.config.endpointFieldType, node.config.endpoint);
						if (url.slice(-1) !== '/') {
							url += '/';
						}
						url += 'users/login';
						let pwd = getField(node, null, node.config.passwordFieldType, node.config.password);

						let body = {
							email: getField(node, null, node.config.userFieldType, node.config.user),
							password: Buffer.from(pwd).toString('base64')
						};
						try {
							const response = await callAPI(url, 'POST', undefined, body, node.config);
							if (response.statusCode == 200) {
								body = JSON.parse(response.body);
								resolve(body['accessToken']);
								node.config.needLogout = true;
							}
							else {
								throw 'Login with username and password failed';
							}
						} catch (err) {
							reject(err);
						}
					} else {
						/* Use a token specified by user  */
						resolve(tokenInput);
					}
				} else {
					/* Use stored token which is already acquired by above */
					resolve(node.config.token);
				}
			});
		}
		node.status({ fill: "grey", shape: "ring", text: "Ready" });
		node.on('input', async (msg, send, done) => {
			send = send || function () { node.send.apply(node, arguments); }
			try {
				/* Notificate error if empty server */
				if (!node.config) {
					throw 'openMetadataConfig node is not configured';
				}

				/* Validate endpoint */
				let endpoint = getField(node, msg, node.config.endpointFieldType, node.config.endpoint);
				if (endpoint.slice(-1) !== '/') {
					endpoint += '/';
				}

				/* Validate username & password */
				let userName = getField(node, msg, node.config.userFieldType, node.config.user);
				let password = getField(node, msg, node.config.passwordFieldType, node.config.password);
				let tokenInput = getField(node, msg, node.tokenInputFieldType, node.config.tokenInput);
				let tokenAcquired = node.config.token;

				if ((!userName || !password) && !tokenInput && !tokenAcquired) {
					throw 'Invalid input: User, password or authenticafication token is required';
				}

				//  Notificate error if user does not choose API. 
				if (!node.resource) {
					throw 'API is not selected';
				}

				/* Validate include_source_fields parameter of search_entities API */
				let include_source_fields = getValueParamname(node, msg, 'include_source_fields');
				if (include_source_fields) {
					try {
						const results = JSON.parse(include_source_fields);
						if (!Array.isArray(results)) {
							throw 'include_source_fields must be the following array form ["value1", "value2", ...]'
						}
					} catch (err) {
						throw 'Invalid input JSON value ' + include_source_fields;
					}
				}

				/* Construct URL and call API */
				const token = await GetToken(node, msg);
				node.config.token = token;

				let { [node.resource]: valueResource } = resourceInfo;
				let {
					segment = '',
					listQueryParamname = [],
					pathParamname = ''
				} = valueResource;

				let urlResult = appendParamNew({
					url: endpoint,
					msg: msg,
					segment: segment,
					pathParamname: pathParamname,
					listQueryParamname: listQueryParamname,
				});

				/* Build a part of url with include_source_fields parameter of search_entities API */
				if (node.resource == 'search_entities' && include_source_fields != undefined) {
					let include_source_fieldsArray = JSON.parse(include_source_fields);
					let include_source_fields_url = include_source_fieldsArray.map((valueInclude) => {
						return `include_source_fields=${valueInclude}`
					}).join('&');
					urlResult += '&' + include_source_fields_url;
				}
				/* Call OpenMetadata API */
				const response = await callAPI(urlResult, 'GET', token, undefined, node.config)
				const body = JSON.parse(response.body);
				if (response.statusCode == 200) {
					msg.payload = body;
					send(msg);
					if (done) {
						done();
					}
				}
				else {
					var err = `API error ${response.statusCode}: ${body.message}`;
					throw err;
				}
				node.status({ fill: "green", shape: "dot", text: "Success" });
			} catch (err) {
				node.status({ fill: "red", shape: "ring", text: "Error" });
				reportError(err, msg, done);
			}
		})
	}

	RED.nodes.registerType('openmetadata', OpenMetadataNode);
};
