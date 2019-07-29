import { Component, ViewChild } from '@angular/core';
import { CanvasWhiteboardComponent } from 'ng2-canvas-whiteboard';
import { Events, ModalController } from '@ionic/angular';
import { BudgetToolProvider } from '../../services/budget-tool.provider';
import { AppState } from '@picsa/models';
import { NgRedux } from '@angular-redux/store';
// import { UserActions } from 'src/actions/user.actions';
import { ICustomBudgetCard } from '../../models/budget-tool.models';

@Component({
  selector: 'budget-new-card',
  templateUrl: './budget-new-card.page.html',
  styleUrls: ['./budget-new-card.page.scss']
})
export class BudgetNewCardPage {
  cardName: string;

  @ViewChild('canvasWhiteboard', { static: false })
  canvasWhiteboard: CanvasWhiteboardComponent;
  constructor(
    private modalCtrl: ModalController,
    private budgetToolProvider: BudgetToolProvider,
    private events: Events,
    private ngRedux: NgRedux<AppState> // private userActions: UserActions
  ) {}

  saveCard() {
    // *** TODO - get type from query params
    // const type = 'TODO';
    // const id = `_custom_${this.budgetToolProvider.firestorePrvdr.db.createId()}`;
    // // *** should add check for uniqueness and possibly strip any other special characters
    // // *** need createdBy but won't be populated if firebase never initialised (could use a second local id)
    // const card: ICustomBudgetCard = {
    //   group: 'other',
    //   name: this.cardName,
    //   id: id,
    //   type: type,
    //   custom: true,
    //   customImg: this.saveCanvasImage(),
    //   created: new Date().toString(),
    //   createdBy: '*** get by redux ***'
    // };
    // console.log('custom budget card created', card);
    // const allCustomCards = Object.assign(
    //   {},
    //   this.ngRedux.getState().user.budgetCustomCards
    // );
    // if (!allCustomCards[type]) {
    //   allCustomCards[type] = [];
    // }
    // allCustomCards[type].push(card);
    // this.userActions.updateUser({ budgetCustomCards: allCustomCards });
    // // publish notification for budget card list to repopulate with new cards
    // this.events.publish('customCards:updated', allCustomCards);
    // this.modalCtrl.dismiss();
  }

  saveCanvasImage() {
    const img = this.canvasWhiteboard.generateCanvasDataUrl('image/png', 0.3);
    return img;
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
