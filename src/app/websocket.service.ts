import { Injectable, ElementRef, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { environment } from '../environments/environment';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { ChatMessageDto } from './chatMessageDto';

@Injectable({
	providedIn: 'root',
})
export class WebsocketService {
	@ViewChild('con') cont: ElementRef;
	@ViewChild('conn', { read: ElementRef }) private elem: ElementRef;

	public ws: any;
	public ws_url = environment.ws_url;
	public chat_ws_url = environment.chat_ws_url;
	public messages = [];
	public chat_text: String;
	public all_goals = new BehaviorSubject([]);
	public project_name: String;
	public mutableObserver: MutationObserver;
	full_data = localStorage.getItem('full_data');
	webSocket: WebSocket;
	messageData: any[] = [];

	constructor() {
		// this.ws = new ReconnectingWebSocket(this.ws_url);
	}

	getProjectGoals(): Observable<any> {
		// ws = new WebSocket(this.ws_url);
		return new Observable<any>((observer) => {
			const context = {
				action: 'getProjectGoals',
				project_id: String(sessionStorage.getItem('project_id')),
				token: sessionStorage.getItem('ws_token'),
			};

			this.ws.send(JSON.stringify(context));
			console.log('sending');

			this.ws.onmessage = (event) => {
				if (JSON.parse(event.data)['type'] == 'get_goals') {
					observer.next(event.data);
					console.log('goals gotten');
					let data = JSON.parse(event.data);
					console.log(data['data']);

					console.log(data);
					if (data['data'] !== 0) {
						sessionStorage.setItem(
							'proj_name',
							data['project_name']
						);
						sessionStorage.setItem(
							'user_data',
							JSON.stringify(data['data'])
						);
					}

					observer.error('Error');
				}
			};
		});
	}

	// getMessages():Observable<any> {

	//   return new Observable(observer => {
	//     this.ws.onopen = (event) => {
	//       console.log('opened')
	//       const secondContext = {
	//         action: "connectToProject",
	//         project_name: String(sessionStorage.getItem('project_name'))
	//       }

	//       this.ws.send(JSON.stringify(secondContext));

	//       const context = {
	//         action:"getRecentMessages",
	//         project_name:String(sessionStorage.getItem('project_name')),
	//         "token": sessionStorage.getItem('ws_token')
	//       };

	//       this.ws.send(JSON.stringify(context));

	//       const context_3 = {
	//         action: "getProjectGoals",
	//         project_id : String(sessionStorage.getItem('project_id')),
	//         "token": sessionStorage.getItem('ws_token')
	//       }

	//       this.ws.send(JSON.stringify(context_3))
	//       console.log('sending')

	//     };

	//     this.ws.onmessage = (event) => {

	//       let data = JSON.parse(event.data)

	//         if (data['type'] == 'all_messages') {
	//           console.log(data)
	//           if (data['messages'] !== undefined) {

	//             data['messages'].forEach((message) => {
	//               this.messages.push(message);
	//             })
	//           }
	//         }

	//         if (data['type'] == 'get_goals') {
	//           console.log(data)
	//           this.all_goals.next(data)
	//           observer.next(data)
	//           sessionStorage.setItem('goals', JSON.stringify(data));
	//         }

	//         if (data['type'] == 'move_goal') {
	//           this.all_goals.next(data)
	//           observer.next(data)

	//           console.log(this.all_goals)
	//         }

	//     }

	//   })

	// }

	// moveGoal(goal_id, to_id, hours, push_id=null, project_id):Observable<any> {
	//   return new Observable(observer => {
	//     const context = {
	//       "action":"moveGoal",
	//       "project_id":project_id,
	//       "to_id" : to_id,
	//       "username": sessionStorage.getItem('username'),
	//       "goal_id": goal_id,
	//       "push_id": push_id,
	//       "hours":hours,
	//       "token": sessionStorage.getItem('ws_token')
	//     }

	//     this.ws.send(JSON.stringify(context));
	//     observer.next("Done")
	//   })

	// }

	// autoScroll() {
	//   window.scrollBy(0,1);
	//   let scrolldelay = setTimeout('autoscroll()', 10);
	// }
	// }

	public openWebSocket() {
		this.webSocket = new WebSocket(this.chat_ws_url);

		this.webSocket.onopen = (event) => {
			console.log('Opened: ', event);
			this.webSocket.send(JSON.stringify({ action: 'getMessages' }));
		};

		this.webSocket.onmessage = async (event) => {
			let data = await JSON.parse(event.data);
			if (data['messages'] !== undefined) {
				data['messages'].forEach((message: object) => {
					this.messageData.push(
						message['body'] ? message['body'] : message
					);
				});
			}
		};

		this.webSocket.onclose = (event) => {
			console.log('Closed: ', event);
		};
	}

	public sendMessage(chatMessageDto: ChatMessageDto) {
		this.webSocket.send(JSON.stringify(chatMessageDto));
	}

	public closeWebSocket() {
		this.webSocket.close();
	}
}
