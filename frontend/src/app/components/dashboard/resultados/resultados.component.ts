import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.scss']
})
export class ResultadosComponent implements OnInit {
  summaryData = {
    pendingTasks: 21,
    completedTasks: 13,
    overdueTasks: 17,
    yesterday: 9,
    openIssues: 24,
    closedToday: 19,
    proposals: 38,
    implemented: 16
  };

  constructor() { }

  ngOnInit(): void {
  }
}
