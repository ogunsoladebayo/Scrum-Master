import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../data.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private router: Router, public dataservice: DataService) {

  }

  ngOnInit() {
    if (sessionStorage.getItem('token')) {
      this.router.navigate(['scrumboard/:project_id'])
    }
  }


}
