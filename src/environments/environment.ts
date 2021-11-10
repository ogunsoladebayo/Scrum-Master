// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	production: false,
	domain_protocol: 'http://',
	domain_name: 'localhost:8000',
	slack_client_id: '241971098774.1519168971767',
	// slack_client_id: '1047148162967.1067254009940',
	ws_url: 'wss://fizhjvoooe.execute-api.us-east-2.amazonaws.com/develop',
	chat_ws_url: 'wss://9oaktw3efg.execute-api.us-east-2.amazonaws.com/chat',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
