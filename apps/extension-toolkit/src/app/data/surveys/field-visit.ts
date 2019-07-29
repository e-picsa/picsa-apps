export const fieldVisit = {
  _key: "farmerVisit",
  name: "Farmer Visit",
  // groups: ["u3EP0KB66MDcD3Ibom0o"],
  isActive: true,
  icon: "farmer-visit",
  surveyJson: {
    title: "Farmer Visit",
    pages: [
      {
        name: "Registration",
        elements: [
          {
            type: "text",
            name: "date",
            title: "Date",
            isRequired: true,
            inputType: "date"
          },
          {
            type: "text",
            name: "location",
            title: "Location",
            isRequired: true
          },
          {
            type: "text",
            name: "name",
            title: "Name of Extension Worker",
            isRequired: true
          },
          {
            type: "text",
            name: "male",
            title: "Number of Male Farmers Present",
            isRequired: true,
            inputType: "number"
          },
          {
            type: "text",
            name: "female",
            title: "Number of Female Farmers Present",
            isRequired: true,
            inputType: "number"
          }
        ],
        title: "Details of visit"
      },
      {
        name: "Feedback",
        elements: [
          {
            type: "comment",
            name: "activities",
            title:
              "Describe what training activities you conducted with the farmers today",
            rows: 3,
            placeHolder: "Please give details"
          },
          {
            type: "comment",
            name: "trainingReaction",
            title:
              "Please give any comments or observations about how the farmers reacted to the training?",
            rows: 3,
            placeHolder:
              "E.g. exercises / activities farmers found useful? anything you observed that you think is interesting? do you see farmers linking picsa with ffa or other services / activities? if yes, how?"
          },
          {
            type: "comment",
            name: "tabletReaction",
            title:
              "Please give any comments or observations on how the farmers reacted to the use of the tablet and the apps for the training",
            rows: 3,
            placeHolder:
              "E.g. did they seem comfortable with using the tablet/app, how did men react compared to women, older farmers compared to younger farmers?"
          },
          {
            type: "comment",
            name: "tabletPositives",
            title:
              "Do you think that the use of the tablet and the app helped the training session in any way? ",
            rows: 3,
            placeHolder: "If so, please can you explain how they helped ."
          },
          {
            type: "comment",
            name: "tabletNegatives",
            title:
              "Do you think that the use of the tablet and the app had any negative effects on the training session?",
            rows: 3,
            placeHolder:
              "If so, please can you explain what these negative effects were."
          },
          {
            type: "comment",
            name: "infoShared",
            title:
              "Did you (or anyone else) in addition to the training, share information from picsa with others in the community (eg using notice boards, other meetings)?",
            rows: 3,
            placeHolder:
              "If yes please give details including date, how many farmers you think may have benefited from this"
          }
        ],
        title: "Feedback"
      }
    ]
  }
};
