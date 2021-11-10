import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data.service';
import * as $ from 'jquery/dist/jquery.min.js';
import { Title } from "@angular/platform-browser";

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  public create_new_project: boolean = false;
  public fieldvalue = '';

  constructor(private router: Router, public dataService: DataService, private titleService: Title) {

  }

  ngOnInit() {
    const showProName = document.getElementById("c") as HTMLInputElement
    showProName.checked = false;
    this.showProField();
    this.titleService.setTitle('Scrum | Signup');
    if (sessionStorage.getItem('token')) {
      this.router.navigate(['scrumboard/' + sessionStorage.getItem('project_id')])
    }
   
  }

  sgnBTN() {
    $('#btn-one').html('<span id="lodr" class="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"></span>SIGN UP').addClass('disabled');
  }


  showProField() {
    let proField = document.getElementById("c") as HTMLInputElement
    let disInput = document.getElementById('ownerField') as HTMLInputElement
    if (proField.checked) {
      disInput.disabled = false
      document.getElementById('owner-Field').style.opacity = '1'
    } else {
      disInput.disabled = true
      document.getElementById('owner-Field').style.opacity = '0.4'
    }
  }

  createUser() {
    let proField = document.getElementById("c") as HTMLInputElement
    if (proField.checked == true) {
      this.dataService.createuser_usertype = 'Owner'
    } else {
      this.dataService.createuser_usertype = 'User'
    }
    document.getElementById('alert-error').style.display = 'none';
    this.dataService.createUser();
  }

  keyup(event) {
    this.dataService.fetchIdentity(this.dataService.createuser_email);
  }


}