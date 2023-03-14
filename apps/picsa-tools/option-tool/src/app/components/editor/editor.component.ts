import {Component,EventEmitter, OnInit, Output ,ViewChild} from '@angular/core';
import { MatStepper } from '@angular/material/stepper'

@Component({
  selector: 'option-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
  // stepCounter: number;
  warningText: string;
  practiceEntry: string;
  gender: string [];
  benefits: {benefit:string, beneficiary:string[]} [];
  perfomanceValues: {lowRf:string, midRf:string,  highRf:string};  
  performanceOptions: string[]=['good','ok','bad']
  investmentValues: {money:string, time:string};  
  investmentOptions: string[]=['high','mid','low']
  benefitsStartTime: string;
  risk:string;
  isLinear = false;

  @ViewChild(MatStepper) stepper: MatStepper;

  @Output() dataTransfer = new EventEmitter();

  ngOnInit(): void {
    // this.stepCounter = 1;
    this.gender=[],
    this.benefits=[{
      benefit:'',
      beneficiary:[]
    },
  ]
  this.perfomanceValues = { lowRf:"ok",midRf:"ok",highRf:"ok"}
  this.investmentValues = {money:'high', time:'high'}
  this.warningText='';
  this.practiceEntry='';
  this.gender= [];
  this.perfomanceValues= {lowRf:"", midRf:"",  highRf:""};  
  this.investmentValues={money:"", time:""};  
  this.benefitsStartTime ="";
  this.risk="" 
  }
  
  handleGender(gender:string){
    if(!this.gender.includes(gender)){
      this.gender.push(gender)
    }else{
     const index = this.gender.indexOf(gender)
     this.gender.splice(index, 1);
    }
  }
  handleBenficiaryGender(index:number, gender:string){
    if(!this.benefits[index].beneficiary.includes(gender)){
      this.benefits[index].beneficiary.push(gender)
    }else{
      const itemIndex = this.benefits[index].beneficiary.indexOf(gender)
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
    if(this.practiceEntry &&
      this.gender.length > 0 &&
      this.benefitsStartTime &&
      this.risk){
    const finalObject = {
      practice:this.practiceEntry,
      gender: this.gender,
      benefits:this.benefits,
      performance:this.perfomanceValues,
      investment:this.investmentValues,
      time:this.benefitsStartTime,
      risk:this.risk
    }
    this.dataTransfer.emit(finalObject);
     this.resetVariables()
     this.resetStepper()
    }else{
      this.warningText = "Please fill all the fields"
    }
  }
  resetVariables(){
    // Reset variables when the component is destroyed.
    this.gender=[],
    this.benefits=[{
      benefit:'',
      beneficiary:[]
    },
  ]
  this.perfomanceValues = { lowRf:"ok",midRf:"ok",highRf:"ok"}
  this.investmentValues = {money:'high', time:'high'}
  this.warningText='';
  this.practiceEntry='';
  this.gender= [];
  this.perfomanceValues= {lowRf:"", midRf:"",  highRf:""};  
  this.investmentValues={money:"", time:""};  
  this.benefitsStartTime ="";
  this.risk=""
  }
  resetStepper(): void {
    this.stepper.reset();
  }
  submitForm() {
    console.log('Form submitted!');
  }
  // ngOnDestroy() {
  //   // Reset variables when the component is destroyed.
   
  // }

}
