import {
	Component,
	OnInit,
	ElementRef,
	TemplateRef,
	ViewChildren,
	QueryList,
	ViewChild,
	AfterViewInit,
	AfterViewChecked,
	OnDestroy,
} from '@angular/core';
import {
	CdkDragStart,
	CdkDragDrop,
	moveItemInArray,
	transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { WebsocketService } from '../websocket.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DataService } from '../data.service';
import { concatMap, concat } from 'rxjs/operators';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { formatDate } from '@angular/common';

import * as $AB from 'jquery';
import { element } from 'protractor';
import { Template } from '@angular/compiler/src/render3/r3_ast';
import { template } from '@angular/core/src/render3';
import { NgForm } from '@angular/forms';
import { ChatMessageDto } from '../chatMessageDto';
import { data } from 'jquery';

@Component({
	selector: 'app-scrumboard',
	templateUrl: './scrumboard.component.html',
	styleUrls: ['./scrumboard.component.css'],
})
export class ScrumboardComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('con') con: ElementRef;
	@ViewChild('conn', { read: ElementRef }) elem: ElementRef;

	public mentionConfig = {
		triggerChar: '@',
		returnTrigger: true,
		maxItems: 10,
		labelKey: 'name',
		dropUp: true,
	};
	public userListOpened: Boolean = false;
	public sendable: Boolean = true;
	public listUsers: string[] = [];
	public imgName = 'No image selected';
	public alert;
	public TFTW = [];
	public TFTD = [];
	public verify = [];
	public done = [];
	public users = [];
	public participants = [];
	public project_id = sessionStorage.getItem('project_id');
	public loggedUser = sessionStorage.getItem('realname');
	public loggedUserProfile = sessionStorage.getItem('realname');
	public loggedUserRole = sessionStorage.getItem('role');
	public loggedUserId;
	public sprints = [];
	public currentSprint = [];
	public notes = [];
	public history_for = [];
	public goal_history = [];
	public scrumhistory_set = [];
	public personal_tasks_history = [];
	public clicked_task_history = [];
	public loggedSprint = {
		sprintID: ' ',
		dateCreated: '2020-03-03T16:33:59.817708Z',
		endDate: '2020-03-03T16:33:59.817708Z',
	};
	public loggedProject;
	public colors = [
		'255, 76, 109',
		'89, 187, 30',
		'221, 164, 72',
		'141, 106, 159',
		'187, 52, 47',
		'131, 116, 91',
		'16, 52, 166',
		'133, 47, 100',
		'38, 166, 154',
	];
	public taskToEdit;
	public goal_name;
	public addToUser = sessionStorage.getItem('role_id');
	public note_to_add;
	public notePriority;
	public push_id;
	public hours = 0;
	public to_id;
	public goal_id;
	public new_role;
	public historyForUser;
	public historyForUserRole;
	public uses_slack = sessionStorage.getItem('user_slack');
	public imageUploaded;
	public mention = { item: '' };

	public ws: any;
	public ws_url = this.wsService.ws_url;
	public my_messages = [];
	public chat_text = '';
	public all_goals = new BehaviorSubject(null);
	public project_name: String;
	public mutableObserver: MutationObserver;
	full_data = localStorage.getItem('full_data');
	public username = sessionStorage.getItem('realname');

	@ViewChildren('details') details: QueryList<any>;

	constructor(
		private http: HttpClient,
		private router: Router,
		private dataService: DataService,
		private pageTitle: Title,
		private route: ActivatedRoute,
		public wsService: WebsocketService,
		public webSocketService: WebsocketService
	) {
		this.ws = new ReconnectingWebSocket(this.ws_url);
	}

	ngOnInit() {
		this.webSocketService.openWebSocket();
		this.load();
		this.rose();
		this.close();
		this.pageTitle.setTitle('Scrumboard');
		this.getMessages().subscribe((data) => {
			//this.getAllUsersGoals(data)
		});

		this.getAllUsernames();

		this.getAllUsersGoals();
		this.getAllSprints();

		this.hideAddTaskandNoteBTN();
		this.openSlackModal();

		let observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type == 'childList') {
					let elem = document.getElementById('messages');
					elem.scrollTop = elem.scrollHeight;
				}
			});

			let records = observer.takeRecords();

			records.forEach((record) => {
				let elem = document.getElementById('messages');
				elem.scrollTop = elem.scrollHeight;
			});
		});
		observer.observe(this.elem.nativeElement, {
			childList: true,
			subtree: true,
		});
	}
	ngOnDestroy() {
		this.webSocketService.closeWebSocket();
	}

	ngAfterViewInit(): void {
		let observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type == 'childList') {
					console.log(mutation);
					let elem = document.getElementById('con');
					elem.scrollTop = elem.scrollHeight;
				}
			});
		});
		observer.observe(this.elem.nativeElement, {
			childList: true,
			subtree: true,
		});
	}

	openDropUpEvent() {
		this.userListOpened = true;
		this.sendable = false;
	}

	closeDropUpEvent() {
		this.userListOpened = false;
	}

	openSlackModal() {
		let modal = document.getElementById('slackModal');
		if (this.uses_slack == 'false') {
			modal.style.display = 'block';
		}
	}

	closeSlackModal() {
		let modal = document.getElementById('slackModal');
		modal.style.display = 'none';
	}

	// sending a message with slack
	sendAMessage(input) {
		if (!this.sendable) {
			this.sendable = true;
			return;
		}

		if (this.sendable && !this.userListOpened) {
			this.oldsendMessage();
			input.value.chat_text = '';
		}
	}

	oldsendMessage() {
		if (this.chat_text) {
			let context = {
				action: 'sendMessage',
				project_id: String(sessionStorage.getItem('project_id')),
				username: String(sessionStorage.getItem('realname')),
				timestamp: this.getCurrentTime(),
				message: this.chat_text,
				token: sessionStorage.getItem('ws_token'),
			};

			this.ws.send(JSON.stringify(context));
			this.chat_text = '';
		}
	}

	connectSlack() {
		this.dataService.connectToSlack();
	}

	showSprintCreate() {
		if (this.loggedUserRole == 'Owner' || this.loggedUserRole == 'Admin') {
			let active = document.getElementById('sprintAlert');
			active.style.display = 'block';
		}
	}

	load() {
		if (window.localStorage) {
			if (!localStorage.getItem('firstLoad')) {
				localStorage['firstLoad'] = true;
				window.location.reload();
			} else localStorage.removeItem('firstLoad');
		}
		window.onload = function () {
			$('.preloader').slideUp(1300);
			let imgBorder1 = document
				.getElementsByClassName('themeImg')
				.item(0) as HTMLElement;
			let imgBorder2 = document
				.getElementsByClassName('themeImg')
				.item(1) as HTMLElement;
			let imgBorder3 = document
				.getElementsByClassName('themeImg')
				.item(2) as HTMLElement;
			let imgBorder4 = document
				.getElementsByClassName('themeImg')
				.item(3) as HTMLElement;
			let imgBorder5 = document
				.getElementsByClassName('themeImg')
				.item(4) as HTMLElement;
			let imgBorder6 = document
				.getElementsByClassName('themeImg')
				.item(5) as HTMLElement;

			let imgBtm1 = document
				.getElementsByClassName('imgBtm')
				.item(0) as HTMLElement;
			let imgBtm2 = document
				.getElementsByClassName('imgBtm')
				.item(1) as HTMLElement;
			let imgBtm3 = document
				.getElementsByClassName('imgBtm')
				.item(2) as HTMLElement;
			let imgBtm4 = document
				.getElementsByClassName('imgBtm')
				.item(3) as HTMLElement;
			let imgBtm5 = document
				.getElementsByClassName('imgBtm')
				.item(4) as HTMLElement;
			let imgBtm6 = document
				.getElementsByClassName('imgBtm')
				.item(5) as HTMLElement;

			//let currentTheme = document.getElementById('currentTheme');
			if (
				localStorage.getItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q'
				) == 'Z556fbesgMPvm2U'
			) {
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211899/Rectangle_4_whcw4u.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'Automobile';
				imgBorder2.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm2.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else if (
				localStorage.getItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q'
				) == 'CArCK4Vm5hyRF5B'
			) {
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211925/Rectangle_5_kflvow.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'Dark Cloud';
				imgBorder3.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm3.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else if (
				localStorage.getItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q'
				) == '32J94BFgeC9zTNf'
			) {
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211929/Rectangle_6_bmdatg.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'Landmark';
				imgBorder4.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm4.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else if (
				localStorage.getItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q'
				) == 'ShFzC9vBEcFz8Rk'
			) {
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211924/Rectangle_7_dff7kq.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'City View';
				imgBorder5.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm5.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else if (
				localStorage.getItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q'
				) == 'XB8svCwGLr359na'
			) {
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211913/Rectangle_8_rieqnp.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'Blue Sky';
				imgBorder6.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm6.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else {
				document.getElementById('splitLeft').style.background = 'white';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'Plain';
				imgBorder1.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm1.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			}
		};

		if (this.loggedUser.includes(' ')) {
			this.loggedUserProfile = this.loggedUser.slice(
				0,
				this.loggedUser.indexOf(' ')
			);
		}
		this.autoHideDialog();
	}

	NotificationBox(alert) {
		let x = document.getElementById('alert');
		document.getElementById('alert').innerHTML = alert;
		x.className = 'show';
		setTimeout(function () {
			x.className = x.className.replace('show', '');
		}, 3000);
	}

	close() {
		let hides = document.getElementById('splitLeft') as HTMLElement;
		let moda = document.getElementById('addTaskModal') as HTMLElement;
		let moda1 = document.getElementById('addNoteModal') as HTMLElement;
		let openEditTaskModal = document.getElementById(
			'editTaskModal'
		) as HTMLElement;
		let uploadImageModal = document.getElementById(
			'uploadImageModal'
		) as HTMLElement;
		let taskHistoryModal = document.getElementById(
			'taskHistoryModal'
		) as HTMLElement;
		let logoutModal = document.getElementById('logoutModal') as HTMLElement;
		let appInfoModal = document.getElementById(
			'appInfoModal'
		) as HTMLElement;
		let userProfileModal = document.getElementById(
			'userProfileModal'
		) as HTMLElement;
		let viewUploadedImageModal = document.getElementById(
			'uploadedImageModal'
		) as HTMLElement;
		let changeRoleModal = document.getElementById(
			'changeUserRoleModal'
		) as HTMLElement;
		moda.style.display = 'none';
		moda1.style.display = 'none';
		hides.style.overflowY = 'scroll';
		openEditTaskModal.style.display = 'none';
		uploadImageModal.style.display = 'none';
		taskHistoryModal.style.display = 'none';
		logoutModal.style.display = 'none';
		appInfoModal.style.display = 'none';
		userProfileModal.style.display = 'none';
		viewUploadedImageModal.style.display = 'none';
		changeRoleModal.style.display = 'none';
	}

	editTaskModal(edit) {
		let openEditTaskModal = document.getElementById(
			'editTaskModal'
		) as HTMLElement;
		openEditTaskModal.style.display = 'block';
		this.taskToEdit = edit.getAttribute('task_to_edit');
		this.dataService.taskIdToEdit =
			'g' + edit.getAttribute('task_id_to_edit');
	}

	uploadImage(edit) {
		let uploadImageModal = document.getElementById(
			'uploadImageModal'
		) as HTMLElement;
		uploadImageModal.style.display = 'block';
		this.dataService.taskIdToEdit =
			'G' + edit.getAttribute('task_id_to_upload_img');
	}

	taskHistory() {
		let taskHistoryModal = document.getElementById(
			'taskHistoryModal'
		) as HTMLElement;
		taskHistoryModal.style.display = 'block';
	}

	userProfileModal(forUser, historyForUser, historyForUserRole) {
		this.clicked_task_history = [];
		this.addToUser = forUser;
		this.historyForUser = historyForUser;
		this.historyForUserRole = historyForUserRole;

		let userProfileModal = document.getElementById(
			'userProfileModal'
		) as HTMLElement;
		userProfileModal.style.display = 'block';

		this.personal_tasks_history.forEach((sprint) => {
			if (
				sprint['timeCreated'] >= this.loggedSprint['dateCreated'] &&
				this.loggedSprint['endDate'] >= sprint['timeCreated'] &&
				sprint['task'] != '' &&
				sprint['taskFor'] == this.addToUser
			) {
				this.clicked_task_history.unshift(sprint);
			}
		});
	}

	userImageModal(imageToView) {
		let imageModal = document.getElementById(
			'imageToView'
		) as HTMLImageElement;
		let viewUploadedImageModal = document.getElementById(
			'uploadedImageModal'
		) as HTMLElement;
		viewUploadedImageModal.style.display = 'block';
		imageModal.src = imageToView.src;
	}

	appInfo() {
		let appInfoModal = document.getElementById(
			'appInfoModal'
		) as HTMLElement;
		appInfoModal.style.display = 'block';
	}

	logoutModal() {
		let logoutModal = document.getElementById('logoutModal') as HTMLElement;
		logoutModal.style.display = 'block';
	}

	addTaskModal(whichmodal, userRoleId) {
		let modal = document.getElementById('addTaskModal') as HTMLElement;
		let modal1 = document.getElementById('addNoteModal') as HTMLElement;
		let userRole = userRoleId.getAttribute('user_role_id');
		this.addToUser = userRole;
		if (whichmodal == 'task') {
			if (
				this.loggedUserRole == 'Owner' ||
				this.loggedUserRole == 'Admin' ||
				this.loggedUserId == this.addToUser
			) {
				modal.style.display = 'block';
			}
		}
		if (whichmodal == 'note') {
			modal1.style.display = 'block';
		}
	}

	rose() {
		let cleartft = document.getElementById(
			'auto_clear_tft'
		) as HTMLInputElement;
		localStorage.getItem('sessiontf') == 'true'
			? (cleartft.checked = true)
			: (cleartft.checked = false);
		let modal = document.getElementById('addTaskModal') as HTMLElement;
		let btnmod = document.getElementById('addTaskBtn') as HTMLElement;

		let modal1 = document.getElementById('addNoteModal') as HTMLElement;
		let btnmod1 = document.getElementById('addNoteBtn') as HTMLElement;

		let openEditTaskModal = document.getElementById(
			'editTaskModal'
		) as HTMLElement;

		let uploadImageModal = document.getElementById(
			'uploadImageModal'
		) as HTMLElement;

		let taskHistoryModal = document.getElementById(
			'taskHistoryModal'
		) as HTMLElement;

		let userProfileModal = document.getElementById(
			'userProfileModal'
		) as HTMLElement;
		let viewUploadedImageModal = document.getElementById(
			'uploadedImageModal'
		) as HTMLElement;
		let logoutModal = document.getElementById('logoutModal') as HTMLElement;
		let appInfoModal = document.getElementById(
			'appInfoModal'
		) as HTMLElement;

		let changeRoleModal = document.getElementById(
			'changeUserRoleModal'
		) as HTMLElement;

		let hides = document.getElementById('splitLeft') as HTMLElement;
		let createSprint = document.getElementById(
			'createSprint'
		) as HTMLElement;

		// let ttAddTask = document.getElementById("ttAddTaskBtn") as HTMLElement;
		// let ttAddNote = document.getElementById("ttAddNoteBtn") as HTMLElement;

		function hideDropDown(element, classToRemove, classToAdd) {
			if (element != null) {
				element.classList.remove(classToRemove);
				element.classList.add(classToAdd);
			}
		}

		btnmod.onclick = function () {
			modal.style.display = 'block';
		};

		if (this.loggedUserRole != 'Owner' && this.loggedUserRole != 'Admin') {
			createSprint.style.display = 'none';
		}

		// ttAddTask.onclick = function () {
		//   modal.style.display = "block";
		// }

		btnmod1.onclick = function () {
			modal1.style.display = 'block';
		};

		// ttAddNote.onclick = function () {
		//   modal1.style.display = "block";
		// }

		window.onclick = function (e) {
			let projectDD = document.getElementById(
				'projectsDDContent'
			) as HTMLElement;
			let themeDD = document.getElementById(
				'themeDDContent'
			) as HTMLElement;
			let sprintDD = document.getElementById(
				'sprintDDContent'
			) as HTMLElement;
			let mymodal = document.getElementById('slackModal');
			let target = e.target as HTMLElement;
			if (e.target == modal) {
				modal.style.display = 'none';
			}

			if (e.target == mymodal) {
				mymodal.style.display = 'none';
			}

			if (e.target == modal1) {
				modal1.style.display = 'none';
				hides.style.overflowY = 'scroll';
			}

			if (e.target == changeRoleModal) {
				changeRoleModal.style.display = 'none';
			}

			if (e.target == openEditTaskModal) {
				openEditTaskModal.style.display = 'none';
			}

			if (e.target == uploadImageModal) {
				uploadImageModal.style.display = 'none';
			}

			if (e.target == taskHistoryModal) {
				taskHistoryModal.style.display = 'none';
				hides.style.overflowY = 'scroll';
			}

			if (e.target == userProfileModal) {
				userProfileModal.style.display = 'none';
				hides.style.overflowY = 'scroll';
			}

			if (e.target == viewUploadedImageModal) {
				viewUploadedImageModal.style.display = 'none';
				hides.style.overflowY = 'scroll';
			}

			if (e.target == appInfoModal) {
				appInfoModal.style.display = 'none';
				hides.style.overflowY = 'scroll';
			}

			if (e.target == logoutModal) {
				logoutModal.style.display = 'none';
				hides.style.overflowY = 'scroll';
			}

			if (
				target.matches('a#themeTab') ||
				target.matches('span#currentTheme') ||
				target.matches('a#themeTab.nav-link.otherNavTools h4')
			) {
				hideDropDown(themeDD, undefined, 'ppDD');
			} else if (target.matches('img.themeImg')) {
				hideDropDown(themeDD, undefined, 'ppDD');
			} else if (
				target.matches('a#sprintTab') ||
				target.matches('span.loggedSprint') ||
				target.matches('a#sprintTab.nav-link.otherNavTools h4')
			) {
				hideDropDown(sprintDD, undefined, 'spDD');
			} else if (
				target.matches(
					'#projectsDDContent.projectsDropDownContent.ppDD'
				) ||
				target.matches(
					'#projectsDDContent.projectsDropDownContent.ppDD p'
				) ||
				target.matches(
					'#projectsDDContent.projectsDropDownContent.ppDD div.projectsDropDownAP'
				) ||
				target.matches(
					'#projectsDDContent.projectsDropDownContent.ppDD p label.switch span.slider.round'
				)
			) {
				hideDropDown(projectDD, undefined, 'ppDD');
			} else if (
				target.matches('#sprintDDContent.sprintDropDownContent.spDD') ||
				target.matches(
					'#sprintDDContent.sprintDropDownContent.spDD p'
				) ||
				target.matches(
					'#sprintDDContent.sprintDropDownContent.spDD p label'
				) ||
				target.matches(
					'#sprintDDContent.sprintDropDownContent.spDD p label.activ'
				) ||
				target.matches(
					'#sprintDDContent.sprintDropDownContent.spDD p span.spanAct'
				) ||
				target.matches(
					'#sprintDDContent.sprintDropDownContent.spDD p span'
				) ||
				target.matches(
					'#sprintDDContent.sprintDropDownContent.spDD #createSprint.sprintDropDownCS'
				)
			) {
				hideDropDown(sprintDD, undefined, 'spDD');
			} else if (
				target.matches('a#projectsTab') ||
				target.matches('span.loggedProject') ||
				target.matches('a#projectsTab.nav-link.otherNavTools h4')
			) {
				hideDropDown(projectDD, undefined, 'ppDD');
			} else if (target.matches('button#signOutBtn.btn.addTbtn')) {
				hideDropDown(projectDD, undefined, undefined);
			} else {
				if (
					document.getElementById('projectsDDContent') != null &&
					document.getElementById('sprintDDContent') != null &&
					document.getElementById('themeDDContent') != null
				) {
					document
						.getElementById('projectsDDContent')
						.classList.add('animateDD');
					document
						.getElementById('sprintDDContent')
						.classList.add('animateDD');
					document
						.getElementById('themeDDContent')
						.classList.add('animateDD');

					setTimeout(
						"document.getElementById('sprintDDContent').classList.remove('spDD')",
						1000
					);
					setTimeout(
						"document.getElementById('themeDDContent').classList.remove('ppDD')",
						1000
					);
					setTimeout(
						"document.getElementById('projectsDDContent').classList.remove('animateDD')",
						1000
					);
					setTimeout(
						"document.getElementById('sprintDDContent').classList.remove('animateDD')",
						1000
					);
					setTimeout(
						"document.getElementById('themeDDContent').classList.remove('animateDD')",
						1000
					);
					setTimeout(
						"document.getElementById('projectsDDContent').classList.remove('ppDD')",
						1000
					);
				}
			}
		};
	}

	createNewProject() {
		this.router.navigate(['signup']);
		sessionStorage.removeItem('token');
	}

	borderRadious(user) {
		let detail = user.getAttribute('data-target');
		document
			.getElementById(detail)
			.classList.toggle('teamTaskDropDownMenuToggle');
		let toggledUp = document.getElementById(`toggledUp${detail}`).classList;
		if (toggledUp.contains('fa-chevron-up')) {
			toggledUp.replace('fa-chevron-up', 'fa-chevron-down');
		} else if (toggledUp.contains('fa-chevron-down')) {
			toggledUp.replace('fa-chevron-down', 'fa-chevron-up');
		}
	}

	hideslackchat() {
		let hideS = document.getElementById('splitRight') as HTMLElement;
		let hides = document.getElementById('splitLeft') as HTMLElement;
		hideS.style.zIndex = '0';
		hides.style.overflowY = 'hidden';
	}

	imageName() {
		let name = document.getElementById('imgUpload') as HTMLInputElement;
		let progressBar = document.getElementById('progressBar');
		let width = 1;
		let progressId = setInterval(time, 10);
		this.imgName = name.files.item(0).name;
		function time() {
			if (width >= 100) {
				clearInterval(progressId);
			} else {
				width++;
				progressBar.style.width = width + '%';
			}
		}
		let imgFile = document.querySelector(
			'input[type=file]'
		) as HTMLInputElement;
		this.dataService.image_uploaded = imgFile.files[0];
	}

	copyToClipboard(taskToCopy) {
		let textToCopy = document.createElement('textarea');
		textToCopy.value = taskToCopy.getAttribute('task_to_edit');
		document.body.appendChild(textToCopy);
		textToCopy.focus();
		textToCopy.select();
		document.execCommand('copy');
		document.body.removeChild(textToCopy);
		this.NotificationBox('Task Copied To Clipboard!');
	}

	changeUserRoleModal(user) {
		document.getElementById('changeUserRoleModal').style.display = 'block';
		this.addToUser = user;
	}

	hideAddTaskandNoteBTN() {
		document.getElementById('addTaskBtn').style.display = 'none';
		document.getElementById('addNoteBtn').style.display = 'none';
		let hideChangeRole = document.querySelectorAll('.fa-user-cog');
		if (this.loggedUserRole == 'Developer') {
			for (let index = 0; index < hideChangeRole.length; index++) {
				hideChangeRole[index].setAttribute('hidden', 'true');
			}
		}
	}

	showAddTaskandNoteBTN() {
		document.getElementById('addTaskBtn').style.display = 'inline';
		document.getElementById('addNoteBtn').style.display = 'inline';
	}

	showProjectTabContents() {
		let projectDropDown = document.getElementById(
			'projectsDDContent'
		) as HTMLElement;
		projectDropDown.classList.add('ppDD');
	}

	selectThemeTabContents() {
		let themeDropDown = document.getElementById(
			'themeDDContent'
		) as HTMLElement;
		themeDropDown.classList.add('ppDD');
	}

	showSprintTabContents() {
		let sprintDropDown = document.getElementById(
			'sprintDDContent'
		) as HTMLElement;
		sprintDropDown.classList.add('spDD');
	}

	useDefaultTheme(theme) {
		let imgBorder1 = document
			.getElementsByClassName('themeImg')
			.item(0) as HTMLElement;
		let imgBorder2 = document
			.getElementsByClassName('themeImg')
			.item(1) as HTMLElement;
		let imgBorder3 = document
			.getElementsByClassName('themeImg')
			.item(2) as HTMLElement;
		let imgBorder4 = document
			.getElementsByClassName('themeImg')
			.item(3) as HTMLElement;
		let imgBorder5 = document
			.getElementsByClassName('themeImg')
			.item(4) as HTMLElement;
		let imgBorder6 = document
			.getElementsByClassName('themeImg')
			.item(5) as HTMLElement;

		let imgBtm1 = document
			.getElementsByClassName('imgBtm')
			.item(0) as HTMLElement;
		let imgBtm2 = document
			.getElementsByClassName('imgBtm')
			.item(1) as HTMLElement;
		let imgBtm3 = document
			.getElementsByClassName('imgBtm')
			.item(2) as HTMLElement;
		let imgBtm4 = document
			.getElementsByClassName('imgBtm')
			.item(3) as HTMLElement;
		let imgBtm5 = document
			.getElementsByClassName('imgBtm')
			.item(4) as HTMLElement;
		let imgBtm6 = document
			.getElementsByClassName('imgBtm')
			.item(5) as HTMLElement;

		function clearBtmBorder() {
			imgBorder1.style.removeProperty('border');
			imgBtm1.style.removeProperty('border');

			imgBorder2.style.removeProperty('border');
			imgBtm2.style.removeProperty('border');

			imgBorder3.style.removeProperty('border');
			imgBtm3.style.removeProperty('border');

			imgBorder4.style.removeProperty('border');
			imgBtm4.style.removeProperty('border');

			imgBorder5.style.removeProperty('border');
			imgBtm5.style.removeProperty('border');

			imgBorder6.style.removeProperty('border');
			imgBtm6.style.removeProperty('border');
		}

		let currentTheme = document.getElementById('currentTheme');
		if (theme == 'theme1') {
			if (typeof Storage !== 'undefined') {
				localStorage.setItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q',
					'Z556fbesgMPvm2U'
				);
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211899/Rectangle_4_whcw4u.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'Automobile';
				//currentTheme.style.marginLeft = "-22px";
				clearBtmBorder();
				imgBorder2.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm2.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else {
				clearBtmBorder();
				document.getElementById('splitLeft').style.background = 'white';
				imgBorder2.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm2.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			}
		} else if (theme == 'theme2') {
			if (typeof Storage !== 'undefined') {
				localStorage.setItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q',
					'CArCK4Vm5hyRF5B'
				);
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211925/Rectangle_5_kflvow.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'Dark Cloud';
				//currentTheme.style.marginLeft = "-22px";
				clearBtmBorder();
				imgBorder3.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm3.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else {
				clearBtmBorder();
				document.getElementById('splitLeft').style.background = 'white';
				imgBorder3.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm3.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			}
		} else if (theme == 'theme3') {
			if (typeof Storage !== 'undefined') {
				localStorage.setItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q',
					'32J94BFgeC9zTNf'
				);
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211929/Rectangle_6_bmdatg.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'Landmark';
				//currentTheme.style.marginLeft = "-30px";
				clearBtmBorder();
				imgBorder4.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm4.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else {
				clearBtmBorder();
				document.getElementById('splitLeft').style.background = 'white';
				imgBorder4.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm4.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			}
		} else if (theme == 'theme4') {
			if (typeof Storage !== 'undefined') {
				localStorage.setItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q',
					'ShFzC9vBEcFz8Rk'
				);
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211924/Rectangle_7_dff7kq.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'City View';
				//currentTheme.style.marginLeft = "-30px";
				clearBtmBorder();
				imgBorder5.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm5.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else {
				clearBtmBorder();
				document.getElementById('splitLeft').style.background = 'white';
				imgBorder5.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm5.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			}
		} else if (theme == 'theme5') {
			if (typeof Storage !== 'undefined') {
				localStorage.setItem(
					'w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q',
					'XB8svCwGLr359na'
				);
				document.getElementById('splitLeft').style.backgroundImage =
					'url(https://res.cloudinary.com/ros4eva/image/upload/v1582211913/Rectangle_8_rieqnp.png)';
				document.getElementsByClassName('currentTheme')[0].innerHTML =
					'Blue Sky';
				//currentTheme.style.marginLeft = "-36px";
				clearBtmBorder();
				imgBorder6.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm6.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			} else {
				clearBtmBorder();
				document.getElementById('splitLeft').style.background = 'white';
				imgBorder6.style.border = '1px solid rgba(0, 0, 0, 0.8)';
				imgBtm6.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
			}
		} else {
			localStorage.removeItem('w5tD6g7Z65evGCeKvCrgeDJpkk9zETRc7Vg3Cw4q');
			document.getElementById('splitLeft').style.background = 'white';
			document.getElementsByClassName('currentTheme')[0].innerHTML =
				'Plain';
			//currentTheme.style.marginLeft = "-55px";
			clearBtmBorder();
			imgBorder1.style.border = '1px solid rgba(0, 0, 0, 0.8)';
			imgBtm1.style.borderBottom = '1px solid rgba(0, 0, 0, 0.8)';
		}
	}

	logout() {
		this.dataService.logout();
	}

	filterUsers(userFilter) {
		userFilter.forEach((element) => {
			this.users.push({
				userColor: ' ',
				userName: element['user']['nickname'],
				userID: element['id'],
				userRole: element['role'],
				userTotalWeekHour: element['total_week_hours'],
				scrumGoalSet: element['scrumgoal_set'].length,
			});
			if (element['user']['nickname'] == this.loggedUser) {
				this.loggedUserId = element['id'];
			}
			element['scrumgoal_set'].forEach((item) => {
				this.personal_tasks_history.push({
					task: item['name'],
					taskFor: item['user'],
					pushID: item['push_id'],
					status: item['status'],
					timeCreated: item['time_created'],
				});
				if (item['status'] == 0) {
					this.TFTW.push({
						task: item['name'],
						taskFor: item['user'],
						goalID: item['goal_project_id'],
						timeCreated: item['time_created'],
						days_failed: item['days_failed'],
						file: item['file'],
					});
				}
				if (item['status'] == 1) {
					this.TFTD.push({
						task: item['name'],
						taskFor: item['user'],
						goalID: item['goal_project_id'],
						timeCreated: item['time_created'],
						days_failed: item['days_failed'],
						file: item['file'],
					});
				}
				if (item['status'] == 2) {
					this.verify.push({
						task: item['name'],
						taskFor: item['user'],
						goalID: item['goal_project_id'],
						pushID: item['push_id'],
						timeCreated: item['time_created'],
						days_failed: item['days_failed'],
						file: item['file'],
					});
				}
				if (item['status'] == 3) {
					this.done.push({
						task: item['name'],
						taskFor: item['user'],
						goalID: item['goal_project_id'],
						pushID: item['push_id'],
						timeCreated: item['time_created'],
						days_failed: item['days_failed'],
						file: item['file'],
					});
				}
				this.filterUserHistory(item);
			});
		});

		for (let i = 0; i < this.users.length; i++) {
			this.users[i].userColor = this.colors[
				this.users.indexOf(this.users[i]) % this.colors.length
			];
		}
	}

	filterUserNotes(user_notes) {
		user_notes.forEach((element) => {
			element['scrumnote_set'].forEach((note) => {
				this.notes.push({
					note: note['note'],
					noteFor: note['user'],
					noteID: note['id'],
					priority: note['priority'],
					timeCreated: note['time_created'],
				});
			});
		});
	}

	filterUserHistory(user_history) {
		if (user_history['scrumgoalhistory_set'].length > 0) {
			user_history['scrumgoalhistory_set'].forEach((item) => {
				this.scrumhistory_set.push({
					history: item['name'],
					historyID: item['id'],
					historyFor: item['user'],
					historyHours: item['hours'],
					historyStatus: item['status'],
					historyMovedBy: item['done_by'],
					historyMessage: item['message'].slice(
						0,
						item['message'].indexOf('by')
					),
					historyProjectID: item['goal_project_id'],
					timeCreated: item['time_created'],
					file: item['file'],
				});
			});
		}
	}

	viewTaskHistory(thisTask) {
		this.goal_history = [];
		this.history_for = [];
		this.scrumhistory_set.forEach((item) => {
			if (thisTask == item['historyProjectID']) {
				this.goal_history.unshift(item);
			}
		});
		this.history_for.push(
			this.goal_history.find((id) => id.historyProjectID == thisTask)
		);
	}

	filterSprints(sprintFilter) {
		sprintFilter.forEach((element) => {
			this.currentSprint.unshift({
				sprintID: element['id'],
				dateCreated: element['created_on'],
				endDate: element['ends_on'],
			});
		});
		if (this.currentSprint.length > 0) {
			this.loggedSprint = this.currentSprint[0];
		}
	}

	getAllUsernames() {
		let project_id = JSON.parse(sessionStorage.getItem('project_id'));
		this.dataService.allProjectUsers(project_id).subscribe((data) => {
			this.listUsers = data['data'];
		});
	}

	getAllUsersGoals() {
		let project_id = JSON.parse(sessionStorage.getItem('project_id'));

		this.dataService.allProjectGoals(project_id).subscribe((data) => {
			this.loggedProject = sessionStorage.getItem('project_name');
			this.participants = data['data'];

			if (this.participants.length != 0) {
				this.filterUsers(this.participants);
				this.filterUserNotes(this.participants);
			}
		});

		this.dataService.getMessages().subscribe((data) => {
			if (data['message'] != undefined) {
				data['message'].forEach((message) => {
					this.my_messages.push(message);
				});
			}
		});
		/*
       
       this.loggedProject = sessionStorage.getItem('project_name')
       this.participants = data['data']

        if (this.participants.length != 0) {
          this.filterUsers(this.participants)
          this.filterUserNotes(this.participants)
        }
     */
	}

	changeLoggedSprint(selectedSprintID, createDate, endDate) {
		let sprint = selectedSprintID.getAttribute('sprintID');
		let sprintCreateDate = createDate.getAttribute('sprint-create-date');
		let sprintEndDate = endDate.getAttribute('sprint-end-date');
		this.loggedSprint.sprintID = sprint;
		this.loggedSprint.dateCreated = sprintCreateDate;
		this.loggedSprint.endDate = sprintEndDate;
		this.currentSprint.shift();
		this.currentSprint.unshift({
			sprintID: this.sprints[this.sprints.length - 1]['id'],
			dateCreated: this.sprints[this.sprints.length - 1]['created_on'],
			endDate: this.sprints[this.sprints.length - 1]['ends_on'],
		});
	}

	getAllSprints() {
		this.dataService.allSprints(this.project_id).subscribe(
			(data) => {
				this.sprints = data;
				if (this.sprints.length > 0) {
					this.filterSprints(this.sprints);
					this.sprintAlertHidden();
				} else {
					if (this.loggedSprint.sprintID == ' ') {
						if (
							this.loggedUserRole == 'Owner' ||
							this.loggedUserRole == 'Admin'
						) {
							document
								.getElementById('sprintAlert')
								.classList.add('sprintAlertVissible');
						} else {
							this.sprintAlertHidden();
						}
					}
				}
			},
			(error) => {
				console.log('error', error);
			}
		);
	}

	sprintAlertHidden() {
		if (
			document
				.getElementById('sprintAlert')
				.classList.contains('sprintAlertVissible')
		) {
			document
				.getElementById('sprintAlert')
				.classList.replace('sprintAlertVissible', 'sprintAlertHidden');
		}
		setTimeout(() => {
			document.getElementById('sprintAlert').style.display = 'none';
		}, 300);
	}

	startSprint() {
		this.dataService.startSprintRequest(this.project_id).subscribe(
			(data) => {
				this.NotificationBox(data['message']);
				//window.top.location = window.top.location
				this.users = [];
				this.sprints = [];
				this.filterSprints(data['data']);
				this.filterUsers(data['users']);
			},
			(error) => {
				if (error['status'] == 401) {
					this.NotificationBox(
						'Session Invalid or Expired. Please Login!'
					);
					this.dataService.logout();
				} else {
					this.NotificationBox('Unexpected Error!');
				}
			}
		);
	}

	startNewSprint() {
		if (this.loggedUserRole == 'Owner' || this.loggedUserRole == 'Admin') {
			if (this.loggedSprint.sprintID != ' ') {
				if (
					Date.parse(this.loggedSprint.endDate) > new Date().valueOf()
				) {
					if (
						confirm(
							`Are You Sure You Want To End Sprint #${this.loggedSprint.sprintID} And Start A New Sprint?`
						)
					) {
						this.startSprint();
					}
				} else {
					this.startSprint();
				}
			} else {
				this.startSprint();
			}
		} else {
			this.NotificationBox('Only Admin and Owner Can Create Sprint');
		}
	}

	addTask() {
		if (
			this.loggedUserRole == 'Owner' ||
			this.loggedUserRole == 'Admin' ||
			this.loggedUserId == this.addToUser
		) {
			this.dataService
				.addTaskRequest(this.project_id, this.addToUser)
				.subscribe(
					(data) => {
						this.NotificationBox(data['message']);
						this.users = [];
						this.TFTD = [];
						this.TFTW = [];
						this.done = [];
						this.verify = [];
						this.filterUsers(data['data']);
					},
					(error) => {
						if (error['status'] == 401) {
							this.NotificationBox(
								'Session Invalid or Expired. Please Login!'
							);
							this.dataService.logout();
						} else {
							this.NotificationBox('Add Task Failed!');
							this.close();
						}
					}
				);
		} else {
			this.close();
			this.NotificationBox(
				`You Can Only Add Task For ${this.loggedUser}`
			);
		}
		this.goal_name = '';
	}

	submitAddTask() {
		if (this.goal_name != '' && this.goal_name != undefined) {
			if (this.goal_name.length >= 4) {
				this.dataService.goal_name = this.goal_name;
				this.addTask();
			} else {
				this.NotificationBox('Please, describe the goal in details');
			}
		} else {
			this.NotificationBox('Goal name cannot be empty!');
		}
	}

	editTask() {
		this.dataService.taskToEdit = this.taskToEdit;
		this.dataService.editTaskRequest(this.project_id).subscribe(
			(data) => {
				this.NotificationBox(data['message']);
				this.users = [];
				this.TFTD = [];
				this.TFTW = [];
				this.done = [];
				this.verify = [];
				this.filterUsers(data['data']);

				if (data['message'] == 'Goal Name Changed!') {
					this.close();
				}
			},
			(error) => {
				if (error['status'] == 401) {
					this.NotificationBox(
						'Session Invalid or Expired. Please Login!'
					);
					this.dataService.logout();
				} else {
					this.NotificationBox('Edit Task Failed!');
					this.close();
				}
			}
		);
	}

	imageUploadAlert() {
		let name = document.getElementById('imgUpload') as HTMLInputElement;
		let uploadImageModal = document.getElementById(
			'uploadImageModal'
		) as HTMLElement;
		if (name.value.length >= 1) {
			this.dataService.imageUploadRequest(this.project_id).subscribe(
				(data) => {
					this.NotificationBox(data['message']);
					this.users = [];
					this.TFTD = [];
					this.TFTW = [];
					this.done = [];
					this.verify = [];
					this.imgName = 'No image selected';
					this.filterUsers(data['data']);

					if (data['message'] == 'Goal Name Changed!') {
						this.close();
					}
				},
				(error) => {
					if (error['status'] == 401) {
						this.NotificationBox(
							'Session Invalid or Expired. Please Login!'
						);
						//this.dataService.logout();
					} else {
						this.NotificationBox('Edit Task Failed!');
						this.close();
					}
					console.log(error);
				}
			);
		}
		uploadImageModal.style.display = 'none';
	}

	addNote() {
		if (this.note_to_add != '' && this.notePriority != undefined) {
			this.dataService
				.addNoteRequest(
					this.project_id,
					this.addToUser,
					this.note_to_add,
					this.notePriority
				)
				.subscribe(
					(data) => {
						// this.users = []
						// this.TFTD = []
						// this.TFTW = []
						// this.done = []
						// this.verify = []
						this.notes = [];
						this.filterUserNotes(data['data']);
						this.NotificationBox(data['message']);
						this.note_to_add = '';
						this.notePriority = undefined;
					},
					(error) => {
						if (error['status'] == 401) {
							this.NotificationBox(
								'Session Invalid or Expired. Please Login!'
							);
							this.dataService.logout();
						} else {
							this.NotificationBox('Add Note Failed!');
							this.close();
						}
					}
				);
		} else {
			this.NotificationBox('Please Fill Out All Fields!');
			return;
		}
	}

	deleteNote(note_id) {
		if (
			this.loggedUserRole == 'Owner' ||
			this.loggedUserRole == 'Admin' ||
			this.loggedUserId == this.addToUser
		) {
			this.dataService
				.deleteNoteRequest(this.project_id, note_id)
				.subscribe(
					(data) => {
						this.notes = [];
						this.filterUserNotes(data['data']);
						this.NotificationBox(data['message']);
					},
					(error) => {
						if (error['status'] == 401) {
							this.NotificationBox(
								'Session Invalid or Expired. Please Login!'
							);
							this.dataService.logout();
						} else {
							this.NotificationBox('Delete Note Failed!');
							this.close();
						}
					}
				);
		}
	}

	addNoteToUserTask(note_to_user) {
		let noteToTask = note_to_user.getAttribute('note_to_task');
		let noteID = note_to_user.getAttribute('note_id');
		if (noteToTask != '' && noteToTask != undefined) {
			if (noteToTask.length >= 4) {
				this.dataService.goal_name = noteToTask;
				this.addTask();
				this.deleteNote(noteID);
			} else {
				this.NotificationBox('Please, describe the goal in details');
			}
		} else {
			this.NotificationBox('Goal name cannot be empty!');
		}
	}
	/*
  processMoveGoalRequest() {
    this.dataService.moveGoalRequest(this.goal_id, this.to_id, this.hours, this.push_id, this.project_id).subscribe(
      data => {
        this.NotificationBox(data['message']);
        this.users = [];
        this.TFTD = [];
        this.TFTW = [];
        this.done = [];
        this.verify = [];
        this.filterUsers(data['data']);

      },
      error => {
        console.log(error)
        this.NotificationBox('Unexpected error!, please try move the task again.')
      }
    )
  } */

	processMoveGoalRequest(): any {
		this.moveGoal(
			this.goal_id,
			this.to_id,
			this.hours,
			this.push_id,
			this.project_id
		).subscribe(
			(data) => {
				console.log(data);
			},
			(error) => {
				console.log(error);
			}
		);

		this.getMessages().subscribe(
			(data) => {
				this.NotificationBox(data['data']['message']);
				this.users = [];
				this.TFTD = [];
				this.TFTW = [];
				this.done = [];
				this.verify = [];
				this.filterUsers(data['data']['data']);
			},
			(error) => {
				console.log(error);
				this.NotificationBox(
					'Unexpected error!, please try move the task again.'
				);
			}
		);
	}

	drop(event: CdkDragDrop<string[]>) {
		this.to_id = event.container.id[event.container.id.length - 1];
		this.goal_id = 'm' + event.item.data.goalID;
		let from_id =
			event.previousContainer.id[event.previousContainer.id.length - 1];
		let goal_for = event.item.data.taskFor;
		if (
			this.loggedUserRole == 'Owner' ||
			this.loggedUserRole == 'Admin' ||
			this.loggedUserRole == 'Quality Analyst' ||
			goal_for == this.addToUser
		) {
			if (event.previousContainer === event.container) {
				moveItemInArray(
					event.container.data,
					event.previousIndex,
					event.currentIndex
				);
			} else if (
				this.loggedUserRole == 'Developer' &&
				this.to_id == '3'
			) {
				this.NotificationBox('Permission Denied!');
			} else {
				if (this.to_id == '2' && from_id != '3') {
					this.push_id_form();
				} else {
					this.dataService
						.moveGoalRequest(
							this.goal_id,
							this.to_id,
							this.hours,
							this.push_id,
							this.project_id
						)
						.subscribe(
							(data) => {
								console.log(data);
							},
							(error) => {
								console.log(error);
							}
						);
				}

				transferArrayItem(
					event.previousContainer.data,
					event.container.data,
					event.previousIndex,
					event.currentIndex
				);
			}
		} else {
			this.NotificationBox(
				`Permission Denied! You Can Only Move Task For ${this.loggedUser}`
			);
		}
	}

	autoHideDialog() {
		(<any>$('div#dialog')).dialog({
			autoOpen: false,
		});
	}

	push_id_form() {
		(<any>$('div#dialog')).dialog('open');
	}

	closeDialog() {
		(<any>$('div#dialog')).dialog('close');
	}

	autoClearTft() {
		if (this.loggedUserRole == 'Owner') {
			this.dataService.autoClearTftRequest(this.project_id).subscribe(
				(data) => {
					this.NotificationBox(data['message']);
					localStorage.setItem('sessiontf', data['to_clear_board']);
				},
				(error) => {
					console.log('An error occured, please try again!');
				}
			);
		} else {
			this.NotificationBox('Permission denied!');
		}
	}

	deleteTask(taskid, taskname) {
		if (
			this.loggedUserRole == 'Owner' ||
			this.loggedUserRole == 'Admin' ||
			this.loggedUserRole == 'Quality Analyst'
		) {
			this.dataService
				.deleteTaskRequest(taskid, taskname, this.project_id)
				.subscribe(
					(data) => {
						this.NotificationBox(data['message']);
						this.users = [];
						this.TFTD = [];
						this.TFTW = [];
						this.done = [];
						this.verify = [];
						this.filterUsers(data['data']);
					},
					(error) => {
						if (error['status'] == 401) {
							this.NotificationBox(
								'Session Invalid or Expired. Please Login!'
							);
							this.dataService.logout();
						} else {
							this.NotificationBox('Delete Task Failed!');
						}
					}
				);
		} else {
			this.NotificationBox('Permision Denied!');
		}
	}

	submitchangeUserRole() {
		if (this.loggedUserRole == 'Owner' || this.loggedUserRole == 'Admin') {
			this.dataService
				.changeUserRoleRequest(
					this.addToUser,
					this.new_role,
					this.project_id
				)
				.subscribe(
					(data) => {
						console.log(this.addToUser);
						this.NotificationBox(data['message']);
						// this.users = [];
						// this.TFTD = [];
						// this.TFTW = [];
						// this.done = [];
						// this.verify = [];
						// this.filterUsers(data['data']);
					},
					(error) => {
						this.NotificationBox(
							'Cannot process your request at this time!'
						);
					}
				);
		} else {
			this.NotificationBox('Permission Denied!');
		}
		this.close();
		this.new_role = '';
	}

	userTaskHistoryForSprint(sprintClicked, user) {
		this.clicked_task_history = [];
		this.currentSprint.forEach((element) => {
			if (element['sprintID'] == sprintClicked) {
				this.personal_tasks_history.forEach((sprint) => {
					if (
						sprint['timeCreated'] >= element['dateCreated'] &&
						element['endDate'] >= sprint['timeCreated'] &&
						sprint['task'] != '' &&
						sprint['taskFor'] == user
					) {
						this.clicked_task_history.unshift(sprint);
					}
				});
			}
		});
	}

	deleteUser() {
		this.dataService
			.deleteUser(
				this.loggedUserRole,
				this.addToUser,
				JSON.parse(sessionStorage.getItem('project_id'))
			)
			.subscribe(
				(data) => {
					this.NotificationBox(data['message']);
					this.users = [];
					this.TFTD = [];
					this.TFTW = [];
					this.done = [];
					this.verify = [];
					this.filterUsers(data['data']);
					this.close();
				},

				(error) => {
					sessionStorage.removeItem('token');
					this.router.navigate(['home']);
				}
			);
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

	getMessages(): Observable<any> {
		return new Observable((observer) => {
			this.ws.onopen = (event) => {
				const secondContext = {
					action: 'connectToProject',
					project_id: String(sessionStorage.getItem('project_id')),
				};

				this.ws.send(JSON.stringify(secondContext));
				/*
  
        const context = {
          action:"getRecentMessages", 
          project_id:String(sessionStorage.getItem('project_id')),
          "token": sessionStorage.getItem('ws_token')
        };
  
        this.ws.send(JSON.stringify(context)); */

				const context_3 = {
					action: 'getProjectGoals',
					project_id: String(sessionStorage.getItem('project_id')),
					token: sessionStorage.getItem('ws_token'),
				};
				//   if (this.all_goals.value == null) {
				// this.ws.send(JSON.stringify(context_3))
				//  }
			};

			this.ws.onmessage = (event) => {
				let data = JSON.parse(event.data);

				if (data['type'] == 'all_messages') {
					if (data['messages'] !== undefined) {
						data['messages'].forEach((message) => {
							this.my_messages.push(message);
						});
					}
				}

				if (data['type'] == 'get_goals') {
					this.all_goals.next(data);
					observer.next(data);
					sessionStorage.setItem('goals', JSON.stringify(data));
				}

				if (data['type'] == 'move_goal') {
					this.all_goals.next(data);
					observer.next(data);

					this.users = [];
					this.TFTD = [];
					this.TFTW = [];
					this.done = [];
					this.verify = [];
					this.filterUsers(data['data']['data']);
				}
			};
		});
	}

	moveGoal(
		goal_id,
		to_id,
		hours,
		push_id = null,
		project_id
	): Observable<any> {
		return new Observable((observer) => {
			this.dataService
				.moveGoalRequest(
					this.goal_id,
					this.to_id,
					this.hours,
					this.push_id,
					this.project_id
				)
				.subscribe(
					(data) => {
						console.log(data);
					},
					(error) => {
						console.log(error);
					}
				);

			observer.next('Done');
		});
	}

	getCurrentTime() {
		let currentDate = new Date();
		return formatDate(currentDate, 'h:mm a . dd-MM-yyyy', 'en-US');
		//return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
	}

	autoScroll() {
		window.scrollBy(0, 1);
		let scrolldelay = setTimeout('autoscroll()', 10);
	}

	sendMessage(sendForm: NgForm) {
		const chatMessageDto = new ChatMessageDto(
			'sendMessage',
			sendForm.value['chat_text']
		);
		this.webSocketService.sendMessage(chatMessageDto);
		sendForm.controls.chat_text.reset();
	}
}
