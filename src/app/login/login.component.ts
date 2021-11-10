import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import { Title } from "@angular/platform-browser";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  constructor(private router: Router, public dataService: DataService, private titleService: Title) { }

  ngOnInit() {
    if (sessionStorage.getItem('token')) {
      this.router.navigate(['scrumboard/' + sessionStorage.getItem('project_id')])
    }
    this.titleService.setTitle('Scrum | Login');
  }

  lgnBTN() {
    $('#btn-one').html('<span id="lodr" class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>LOGIN').addClass('disabled');
  }


  login() {
    document.getElementById('alert-error').style.display = 'none';
    this.dataService.login();
  }
}
