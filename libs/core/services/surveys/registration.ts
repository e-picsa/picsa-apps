export const registration = {
  _key: "deviceRegistration",
  name: "Device Registration",
  isActive: true,
  icon: "device-registration",
  surveyJson: {
    pages: [
      {
        name: "Registration",
        elements: [
          {
            type: "text",
            name: "Name",
            title: "Name",
            isRequired: true
          },
          {
            type: "radiogroup",
            name: "Role",
            title: "Role",
            isRequired: true,
            choices: [
              {
                value: "AEDO",
                text: "AEDO"
              },
              {
                value: "AEDC",
                text: "AEDC"
              },
              {
                value: "Other",
                text: "Other"
              }
            ]
          },
          {
            type: "text",
            name: "OtherRole",
            visibleIf: "{Role} = 'Other'",
            title: "Please specify"
          },
          {
            type: "checkbox",
            name: "Gender",
            title: "Gender",
            choices: [
              {
                value: "item1",
                text: "Male"
              },
              {
                value: "item2",
                text: "Female"
              }
            ]
          }
        ],
        title: "Device Registration"
      }
    ]
  }
};
