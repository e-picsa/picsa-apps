import { Component } from "@angular/core";

@Component({
  selector: "app-changelog",
  templateUrl: "./changelog.page.html",
  styleUrls: ["./changelog.page.scss"]
})
export class ChangelogPage {
  whatsAppGroup = {
    label: "App Feedback",
    description: "Give your suggestions or ask for help using the PICSA app",
    link: "https://chat.whatsapp.com/8wEc1tjLRqI7XyU4Lv5OLk"
  };
  constructor() {}

  errorTest() {
    throw new Error('Error received from "Error Test" button');
  }
}
