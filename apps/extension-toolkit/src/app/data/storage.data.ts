import { IData, IResource } from "../models/models";
import { forms } from "./surveys/surveys";

/* 
data in this file is saved locally for retrieval (via storage provider), and the keys
are used to automatically sync data from the live db (via firebase provider)

*/
const resources: IResource[] = [
  {
    _key: "4I4F36gD0MUef26HfPZG",
    name: "PICSA Manual",
    filename: "picsa-field-manual.pdf",
    type: "pdf",
    image: "assets/resources/picsa-field-manual-cover.png",
    group: "PICSA Manual",
    weblink:
      "https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Resources%2Fpicsa-field-manual.pdf?alt=media&token=c394b68a-3f67-4494-8620-c35d65151c45"
  },
  {
    _key: "9Pkro1VYBUlwuNg5oHok",
    name: "Crop Information - Chileka",
    filename: "crop-info-sheet-chileka.pdf",
    type: "pdf",
    image: "assets/resources/crop-info-sheet-chileka-cover.png",
    group: "Documents",
    viewableBy: ["wfp-2017"],
    region: "Malawi",
    weblink:
      "https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Resources%2Fcrop-info-sheet-chileka.pdf?alt=media&token=cb8a6243-1d37-43f6-a97c-a0a7bc0f11f2"
  },
  {
    _key: "6VjjF3yZJejFigwDIPr8",
    name: "Potential Training Schedule",
    filename: "potential-PICSA-training-schedule.pdf",
    type: "pdf",
    image: "assets/resources/potential-PICSA-training-schedule-cover.png",
    group: "Documents",
    weblink:
      "https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Resources%2Fpotential-PICSA-training-schedule.pdf?alt=media&token=618737d1-949b-467a-9f28-1dcc35ce3c8c"
  },
  {
    _key: "m6I8TfROsyr5Wp73BcAd",
    name: "RAM Refresher",
    filename: "ram-refresher.mp4",
    type: "video",
    image: "assets/resources/ram-refresher-cover.jpg",
    group: "Videos",
    weblink:
      "https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Resources%2Fram-refresher.mp4?alt=media&token=27939a71-0656-440b-8407-24877acaeede",
    youtubeID: "Kw5UznKvCN8"
  },
  {
    _key: "Yx8927IVTGyM1C4njOIv",
    name: "Seasonal Forecast Mangochi 2017-2018",
    filename: "seasonal-forecast-mangochi-2017-2018.pdf",
    type: "pdf",
    image: "assets/resources/seasonal-forecast-mangochi-2017-2018.png",
    group: "Documents",
    weblink:
      "https://firebasestorage.googleapis.com/v0/b/extension-toolkit.appspot.com/o/Resources%2Fseasonal-forecast-mangochi-2017-2018.pdf?alt=media&token=c60180cd-8dcd-4d98-aa7e-48f37dc83849"
  }
];

const groups = [
  {
    _key: "u3EP0KB66MDcD3Ibom0o",
    name: "PICSA Mangochi Training 2018",
    accessKey: "picsa",
    defaults: null,
    order: 10
  }
];

const whatsappGroups = [];

// make available as single export so keys can all be taken in one go
// update version number to automatically override old data if this file has been updated in line with live db
// (don't want to automatically pull current version number as then this will override data that is on live db but not downloaded prior to release)
const data: IData = {
  _version: 10102,
  forms: forms,
  resources: resources,
  groups: groups,
  whatsappGroups: whatsappGroups
};
export default data;
