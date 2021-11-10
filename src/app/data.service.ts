import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { timingSafeEqual } from 'crypto';
import { environment } from '../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class DataService {
	public domain_name = environment.domain_name;
	public domain_protocol = environment.domain_protocol;
	public client_id = environment.slack_client_id;
	//public client_id = '1047148162967.1067254009940';
	//public domain_protocol = 'http://';
	//public domain_name = 'localhost:8000';
	//public domain = 'http://localhost:8000';
	public my_project = sessionStorage.getItem('project_name');
	public message;
	public goal_name;

	public login_username;
	public login_password;
	public login_project;

	public createuser_email;
	public createuser_password;
	public createuser_fullname;
	public createuser_usertype;
	public createuser_projname;
	public add_slack: boolean = false;

	public inviteuser_email;
	public message_body;

	public username;
	public user_slack;
	public project_slack;
	public slack_username;
	public slack_app_id;
	public realname;
	public project;

	public taskIdToEdit;
	public taskToEdit;
	public image_uploaded: File = null;
	public image_name;

	public httpOptions = {
		headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
	};

	public authOptions;
	public imageAuthOptions;

	constructor(private http: HttpClient, private router: Router) {}

	createUser() {
		this.http
			.post(
				this.domain_protocol +
					this.domain_name +
					'/scrum/api/scrumusers/',
				JSON.stringify({
					email: this.createuser_email,
					password: this.createuser_password,
					full_name: this.createuser_fullname,
					usertype: this.createuser_usertype,
					projname: this.createuser_projname,
				}),
				this.httpOptions
			)
			.subscribe(
				(data) => {
					if (
						data['message'] == 'User Created Successfully.' ||
						data['message'] ==
							'Project Created Successfully for already existing User.'
					) {
						document.getElementById('alert-success').style.display =
							'block';
						setTimeout(() => {
							this.router.navigate(['login']);
						}, 3000);

						console.log(this.createuser_usertype);
						// this.addToSlack();
					} else {
						document.getElementById('alert-error').style.display =
							'block';
						document.getElementById('lodr').style.display = 'none';
						this.message = 'creating account.';
						this.createuser_password = '';
						this.createuser_fullname = '';
						this.createuser_projname = '';

						// document.getElementById('alert-error').style.display = 'block';
						// this.router.navigateByUrl('/', {skipLocationChange: true}).then(()=>
						// this.router.navigate(['createuser']));
					}
					this.message = data['message'];
					this.createuser_email = '';
					this.createuser_password = '';
					this.createuser_fullname = '';
					this.createuser_projname = '';

					this.slack_app_id = data['client_id'];
				},
				(err) => {
					document.getElementById('lodr').style.display = 'none';
					document.getElementById('alert-error').style.display =
						'block';
					this.message = 'User already exists or invalid data';
					this.createuser_password = '';
					this.createuser_fullname = '';
					this.createuser_projname = '';
				}
			);
	}

	// user integration to workspace
	// addToSlack() {
	//   let usertype = String(sessionStorage.getItem('role'));
	//   let email = String(sessionStorage.getItem('username'));
	//   let project_name = this.my_project
	//   let the_name = sessionStorage.getItem('realname');
	//     console.log(project_name)
	//     sessionStorage.removeItem('token');
	//     window.location.replace("https://slack.com/oauth/v2/authorize?client_id=" + this.client_id + "&state=main_chat_" + project_name + ">>>" + email + "<<<" + the_name + "&scope=channels:history,channels:read,chat:write,emoji:read,files:read,groups:read,im:history,im:read,incoming-webhook,mpim:read,reactions:read,team:read,users.profile:read,users:read,mpim:history,groups:history&user_scope=users:read,chat:write,channels:read,channels:history,groups:read,groups:history")

	// }

	connectToSlack() {
		let usertype = String(sessionStorage.getItem('role'));
		let email = String(sessionStorage.getItem('username'));
		let project_name = this.my_project;
		let the_name = sessionStorage.getItem('realname');
		console.log(project_name);
		sessionStorage.removeItem('token');
		window.location.replace(
			'https://slack.com/oauth/v2/authorize?client_id=' +
				this.client_id +
				'&state=main_chat_' +
				project_name +
				'>>>' +
				email +
				'<<<' +
				the_name +
				'&scope=channels:history,channels:read,chat:write,emoji:read,files:read,groups:read,im:history,im:read,incoming-webhook,mpim:read,reactions:read,team:read,users.profile:read,users:read,mpim:history,groups:history&user_scope=users:read,chat:write,channels:read,channels:history,groups:read,groups:history'
		);
		// window.location.replace("https://slack.com/oauth/v2/authorize?client_id=1047148162967.1067254009940" + "&state=main_chat_" + project_name + ">>>" + email + "<<<" + the_name + "&user_scope=identity.basic, identity.email, identity.avatar")
	}

	getMessages() {
		return this.http.post<any>(
			this.domain_protocol +
				this.domain_name +
				'/scrum/api/get_messages/',
			JSON.stringify({
				project_name: sessionStorage.getItem('project_name'),
				token: sessionStorage.getItem('ws_token'),
			}),
			this.httpOptions
		);
	}

	login() {
		this.http
			.post(
				this.domain_protocol +
					this.domain_name +
					'/scrum/api-token-auth/',
				JSON.stringify({
					username: this.login_username,
					password: this.login_password,
					project: this.login_project,
				}),
				this.httpOptions
			)
			.subscribe(
				(data) => {
					localStorage.setItem('full_data', JSON.stringify(data));
					sessionStorage.setItem('username', this.login_username);
					sessionStorage.setItem('realname', data['name']);
					sessionStorage.setItem('role', data['role']);
					sessionStorage.setItem('role_id', data['role_id']);
					sessionStorage.setItem('token', data['token']);
					sessionStorage.setItem('project_id', data['project_id']);
					sessionStorage.setItem(
						'to_clear_board',
						data['to_clear_board']
					);
					sessionStorage.setItem('user_slack', data['user_slack']);
					sessionStorage.setItem(
						'project_slack',
						data['project_slack']
					);
					sessionStorage.setItem(
						'slack_username',
						data['slack_username']
					);
					sessionStorage.setItem('ws_token', data['ws_token']);
					sessionStorage.setItem(
						'project_name',
						data['project_name']
					);
					localStorage.setItem('sessiontf', data['to_clear_board']);
					this.username = this.login_username;
					this.realname = data['name'];
					this.user_slack = data['user_slack'];
					this.project_slack = data['project_slack'];
					this.slack_username = data['slack_username'];
					this.message = 'Welcome!';
					this.router.navigate(['scrumboard', data['project_id']]);
					this.my_project = JSON.parse(data['project_name']);
					this.login_username = '';
					this.login_password = '';
					this.login_project = '';
				},
				(err) => {
					document.getElementById('alert-error').style.display =
						'block';
					if (err['status'] == 400)
						this.message = 'Login Failed: Invalid Credentials.';
					else this.message = 'Login Failed! Unexpected Error!';
					console.error(err);
					document.getElementById('lodr').style.display = 'none';
					this.login_username = '';
					this.login_password = '';
					this.login_project = '';
				}
			);
	}

	fetchIdentity(email) {
		this.http
			.post(
				this.domain_protocol +
					this.domain_name +
					'/scrum/api/scrumuserfetch/',
				JSON.stringify({ username: email }),
				this.httpOptions
			)
			.subscribe(
				(data) => {
					let fullname = data['fullname'];

					this.createuser_fullname = fullname;
				},

				(err) => {
					console.log('Could not be fetched');
				}
			);
	}

	getHeader() {
		return {
			headers: new HttpHeaders({
				'Content-Type': 'application/json',
				Authorization: 'JWT ' + sessionStorage.getItem('token'),
			}),
		};
	}

	ImageAuthgetHeader() {
		return {
			headers: new HttpHeaders({
				Authorization: 'JWT ' + sessionStorage.getItem('token'),
			}),
		};
	}

	loggedIn() {
		return sessionStorage.getItem('token');
	}

	logout() {
		sessionStorage.removeItem('token');
		this.router.navigate(['home']);
	}

	allProjectUsers(project_id) {
		return this.http.post<any>(
			this.domain_protocol +
				this.domain_name +
				'/scrum/api/get_all_usernames/',
			JSON.stringify({ project_id: project_id }),
			this.getHeader()
		);
	}

	allProjectGoals(project_id) {
		return this.http.get<any>(
			this.domain_protocol +
				this.domain_name +
				'/scrum/api/scrumprojects/' +
				project_id,
			this.httpOptions
		);
	}

	allSprints(project_id) {
		return this.http.get<any>(
			this.domain_protocol +
				this.domain_name +
				'/scrum/api/scrumsprint/?goal_project_id=' +
				project_id,
			this.httpOptions
		);
	}

	startSprintRequest(project_id) {
		let sprint_start_date = new Date(new Date().getTime());
		let sprint_end_date = new Date(
			new Date().getTime() + 7 * 24 * 60 * 60 * 1000
		);
		return this.http.post(
			this.domain_protocol +
				this.domain_name +
				'/scrum/api/scrumsprint/?goal_project_id=' +
				project_id,
			JSON.stringify({
				project_id: project_id,
				created_on: sprint_start_date,
				ends_on: sprint_end_date,
			}),
			this.getHeader()
		);
	}

	addTaskRequest(project_id, user_role_id) {
		return this.http.post(
			this.domain_protocol + this.domain_name + '/scrum/api/scrumgoals/',
			JSON.stringify({
				name: this.goal_name,
				user: 'm' + user_role_id,
				project_id: project_id,
			}),
			this.getHeader()
		);
	}

	editTaskRequest(project_id) {
		return this.http.put(
			this.domain_protocol + this.domain_name + '/scrum/api/scrumgoals/',
			JSON.stringify({
				mode: 1,
				goal_id: this.taskIdToEdit,
				new_name: this.taskToEdit,
				project_id: project_id,
			}),
			this.getHeader()
		);
	}

	imageUploadRequest(project_id) {
		let file: File = this.image_uploaded;
		let imageUpload = new FormData();
		imageUpload.append('image', file, file.name);
		imageUpload.append('mode', '1');
		imageUpload.append('goal_id', this.taskIdToEdit);
		imageUpload.append('project_id', project_id);

		return this.http.put(
			this.domain_protocol + this.domain_name + '/scrum/api/scrumgoals/',
			imageUpload,
			this.ImageAuthgetHeader()
		);
	}

	addNoteRequest(project_id, user_role_id, note, priority) {
		return this.http.post(
			this.domain_protocol + this.domain_name + '/scrum/api/scrumnotes/',
			JSON.stringify({
				note: note,
				priority: priority,
				user: 'm' + user_role_id,
				project_id: project_id,
			}),
			this.getHeader()
		);
	}

	deleteNoteRequest(project_id, note_id) {
		return this.http.put(
			this.domain_protocol + this.domain_name + '/scrum/api/scrumnotes/',
			JSON.stringify({ id: note_id, project_id: project_id }),
			this.getHeader()
		);
	}

	moveGoalRequest(goal_id, to_id, hours, push_id, project_id) {
		return this.http.patch(
			this.domain_protocol + this.domain_name + '/scrum/api/scrumgoals/',
			JSON.stringify({
				goal_id: goal_id,
				to_id: to_id,
				hours: hours,
				project_id: project_id,
				push_id: push_id,
			}),
			this.getHeader()
		);
	}

	changeGoalOwner(goal_id, to_id, project_id) {
		return this.http.put(
			this.domain_protocol + this.domain_name + '/scrum/api/scrumgoals/',
			JSON.stringify({
				mode: 0,
				goal_id: goal_id,
				to_id: to_id,
				project_id: project_id,
			}),
			this.getHeader()
		);
	}

	autoClearTftRequest(project_id) {
		return this.http.put(
			this.domain_protocol + this.domain_name + '/scrum/api/scrumgoals/',
			JSON.stringify({ mode: 3, project_id: project_id }),
			this.getHeader()
		);
	}

	deleteTaskRequest(goal_id, goal_name, project_id) {
		return this.http.put(
			this.domain_protocol + this.domain_name + '/scrum/api/scrumgoals/',
			JSON.stringify({
				mode: 2,
				goal_id: 'm' + goal_id,
				new_name: goal_name,
				project_id: project_id,
			}),
			this.getHeader()
		);
	}

	changeUserRoleRequest(user_id, role, project_id) {
		return this.http.patch(
			this.domain_protocol +
				this.domain_name +
				'/scrum/api/scrumprojectroles/',
			JSON.stringify({
				role: role,
				id: 'm' + user_id,
				project_id: project_id,
			}),
			this.getHeader()
		);
	}

	deleteUser(user_role, intended_user, project_id) {
		return this.http.post(
			this.domain_protocol + this.domain_name + '/scrum/api/delete_user/',
			JSON.stringify({
				intended_user: intended_user,
				user_role: user_role,
				project_id: project_id,
			}),
			this.getHeader()
		);
	}
}
