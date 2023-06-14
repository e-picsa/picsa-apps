import { Component } from '@angular/core';

@Component({
  selector: 'picsa-manual-steps-container',
  templateUrl: './stepsContainer.component.html',
  styleUrls: ['./stepsContainer.component.scss'],
})



export class stepsContainerComponent {
  public steps = {
    LongBeforeSeason: [
      {
        name:"Resource Allocation Map",
        link:"/allocation_map",
        icon:"picsa_manual_resource_allocation"
      },
      {
        name:"Seasonal Calender",
        link:"/allocation_map",
        icon:"picsa_manual_calender"
      },
      {
        name:"Historic climate",
        link:"/allocation_map",
        icon:"picsa_manual_temperature"
      },
      {
        name:"Probability and Risk",
        link:"/allocation_map",
        icon:"picsa_manual_campus"
      },
      {
        name:"Crop Info",
        link:"/allocation_map",
        icon:"picsa_manual_crop"
      },
      {
        name:"Livestock Info",
        link:"/allocation_map",
        icon:"picsa_manual_livestock"
      },
      {
        name:"Livelihood",
        link:"/allocation_map",
        icon:"picsa_manual_place_holder"
      }
    ],
    JustBeforeSeason: [
      {
        name:"Response to Forcast",
        link:"/allocation_map",
        icon:"picsa_manual_place_holder"
      },
    ],
    DuringSeason: [
      {
        name:"Response to short-term Forcast",
        link:"/allocation_map",
        icon:"picsa_manual_place_holder"
      },
    ],
    AfterSeason: [
      {
        name:"Review PICSA approach",
        link:"/allocation_map",
        icon:"picsa_manual_place_holder"
      },
    ]
  }
}
