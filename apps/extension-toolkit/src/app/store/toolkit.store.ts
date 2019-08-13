// TODO

// private async setHardcodedData() {
//   const endpoint = 'budgetTool/_all/cards';
//   const docs: IBudgetCardDB[] = CARDS.map(card => {
//     return {
//       ...card,
//       // add doc metadata - this would be auto populated however want to keep
//       // reference of app version date so can be overwritten by db if desired
//       _created: new Date(APP_VERSION.date).toISOString(),
//       _modified: new Date(APP_VERSION.date).toISOString(),
//       _key: `${card.type}_${card.id}`
//     };
//   });
//   await this.db.setDocs(endpoint, docs);
// }
