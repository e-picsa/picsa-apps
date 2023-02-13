import {Component, Inject, OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'

@Component({
  selector: 'option-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
  stepCounter: number;
  practiceEntry: string;
  gender: string [];
  benefits: {benefit:string, beneficiary:string[]} [];
  perfomanceValues: {lowRf:string, midRf:string,  highRf:string};  
  performanceOptions: string[]=['good','ok','bad']
  investmentValues: {money:string, time:string};  
  investmentOptions: string[]=['high','mid','low']
  benefitsStartTime: string;
  risk:string;

  constructor(
    public dialogRef: MatDialogRef<EditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }
  ngOnInit(): void {
    this.stepCounter = 1;
    this.gender=[],
    this.benefits=[{
      benefit:'',
      beneficiary:[]
    },
  ]
  this.perfomanceValues = { lowRf:"ok",midRf:"ok",highRf:"ok"}
  this.investmentValues = {money:'high', time:'high'}
  }
  handlePracticeEntryNext(){
    this.stepCounter +=1; 
  }
  handlePrevious(){
    if((this.stepCounter-1) > 0){
      this.stepCounter -=1;
    }
  }
  handleGender(gender:string){
    if(!this.gender.includes(gender)){
      this.gender.push(gender)
    }else{
      let index = this.gender.indexOf(gender)
     this.gender.splice(index, 1);
    }
  }
  handleBenficiaryGender(index:number, gender:string){
    if(!this.benefits[index].beneficiary.includes(gender)){
      this.benefits[index].beneficiary.push(gender)
    }else{
      let itemIndex = this.benefits[index].beneficiary.indexOf(gender)
      this.benefits[index].beneficiary.splice(itemIndex, 1);
    }
  }
  handleRemovingBenefits(index:number){
    this.benefits.splice(index, 1);
  }
  handleMoreBenefits(){
    this.benefits.push({
      benefit:'',
      beneficiary:[]
    })
  }
  onlyNumbers(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  async finishProcess  (){
    //compile collected data
    const finalObject = {
      practice:this.practiceEntry,
      gender: this.gender,
      benefits:this.benefits,
      performance:this.perfomanceValues,
      investment:this.investmentValues,
      time:this.benefitsStartTime,
      risk:this.risk
    }
    this.dialogRef.close({event:'Add',data:finalObject});
  }

}
