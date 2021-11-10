export class ChatMessageDto {
	action: string;
	username: string;
	content: string;
	timestamp: string;

	constructor(action: string, content: string) {
		this.action = action;
		this.username = sessionStorage.getItem('realname');
		this.content = content;
		this.timestamp = this.getCurrentTime();
	}

	getCurrentTime() {
		return new Date()
			.toLocaleTimeString()
			.replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, '$1$3');
	}
}
