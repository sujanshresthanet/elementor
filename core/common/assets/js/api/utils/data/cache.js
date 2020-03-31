export default class Cache {
	constructor( manager ) {
		this.manager = manager;

		this.cache = {};
	}

	load( method, requestData, response ) {
		switch ( method ) {
			case 'GET': {
				const componentName = requestData?.component?.getNamespace(),
					isCommandGetItemId = requestData.command === componentName,
					isIndexCommand = requestData.endpoint + '/index' === requestData.command,
					isQueryEmpty = 1 === Object.values( requestData.args.query ).length,

					addCache = ( key, value ) => this.cache[ key ] = value,
					addCacheEndpoint = ( controller, endpoint, value ) => addCache( controller + '/' + endpoint, value );

				if ( isQueryEmpty && 1 === isCommandGetItemId ) {
					Object.keys( response ).forEach( ( key ) => {
						addCacheEndpoint( requestData.command, key, response[ key ] );
					} );
				} else if ( isQueryEmpty && isIndexCommand ) {
					// Handles situation when 'index' was forced to use like in 'globals' component.
					Object.entries( response ).forEach( ( [ key, value ] ) => {
						if ( 'object' === typeof value ) {
							Object.entries( value ).forEach( ( [ endpoint, endpointResponse ] ) => {
								addCacheEndpoint( componentName, key + '/' + endpoint, endpointResponse );
							} );
						} else {
							throw Error( `Invalid type: '${ value }'` );
						}
					} );
				} else {
					addCache( requestData.endpoint, response );
				}
			}
			break;

			default:
				throw Error( `Invalid method: '${ method }'` );
		}
	}

	fetch( methodType, requestData ) {
		switch ( methodType ) {
			case 'get': {
				if ( this.cache[ requestData.endpoint ] ) {
					return new Promise( async ( resolve ) => {
						resolve( this.cache[ requestData.endpoint ] );
					} );
				}
			}
			break;

			default:
				throw Error( `Invalid method: '${ methodType }'` );
		}

		return false;
	}
}
