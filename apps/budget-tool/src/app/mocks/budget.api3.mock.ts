import { IBudget } from "../models/budget-tool.models";

export const PB_MOCK_API_3: IBudget = {
  apiVersion: 3,
  archived: false,
  created: "2018-10-15T10:12:47.118Z",
  data: {
    "0": {
      activities: {
        "land-clearing": {
          name: "land clearing",
          id: "land-clearing",
          isSelected: true
        },
        ploughing: {
          name: "ploughing",
          id: "ploughing",
          isSelected: true
        }
      },
      inputs: {
        "tractor-hire": {
          name: "tractor hire",
          id: "tractor-hire",
          quantity: 1,
          cost: -5000,
          isSelected: true
        },
        "labour---paid": {
          name: "labour - paid",
          id: "labour---paid",
          quantity: 1,
          cost: -500,
          isSelected: true
        }
      },
      familyLabour: {
        "family-labour": {
          name: "family labour",
          id: "family-labour",
          people: 2,
          days: 3,
          isSelected: true
        }
      },
      outputs: {},
      produceConsumed: {}
    },
    "1": {
      activities: {
        sowing: {
          name: "sowing",
          id: "sowing",
          isSelected: true
        }
      },
      inputs: {
        seeds: {
          name: "seeds",
          id: "seeds",
          quantity: 4,
          cost: -500,
          isSelected: true
        }
      },
      familyLabour: {
        "family-labour": {
          name: "family labour",
          id: "family-labour",
          people: 1,
          days: 2,
          isSelected: true
        }
      }
    },
    "2": {
      activities: {
        weeding: {
          name: "weeding",
          id: "weeding",
          isSelected: true
        },
        "apply-fertiliser": {
          name: "apply fertiliser",
          id: "apply-fertiliser",
          isSelected: true
        }
      },
      inputs: {
        fertiliser: {
          name: "fertiliser",
          id: "fertiliser",
          quantity: 1,
          cost: -1000,
          isSelected: true
        }
      },
      familyLabour: {
        "family-labour": {
          name: "family labour",
          id: "family-labour",
          people: 2,
          days: 2,
          isSelected: true
        }
      }
    },
    "3": {
      activities: {
        weeding: {
          name: "weeding",
          id: "weeding",
          isSelected: true
        }
      },
      inputs: {},
      familyLabour: {
        "family-labour": {
          name: "family labour",
          id: "family-labour",
          people: 2,
          days: 1,
          isSelected: true
        }
      }
    },
    "4": {
      activities: {
        "apply-fertiliser": {
          name: "apply fertiliser",
          id: "apply-fertiliser",
          isSelected: true
        }
      },
      inputs: {
        fertiliser: {
          name: "fertiliser",
          id: "fertiliser",
          quantity: 1,
          cost: -500,
          isSelected: true
        }
      },
      familyLabour: {
        "family-labour": {
          name: "family labour",
          id: "family-labour",
          people: 1,
          days: 2,
          isSelected: true
        }
      }
    },
    "5": {
      activities: {
        harvesting: {
          name: "harvesting",
          id: "harvesting",
          isSelected: true
        },
        "marketing-and-selling": {
          name: "marketing and selling",
          id: "marketing-and-selling",
          isSelected: true
        }
      },
      inputs: {
        "transportation-hire": {
          name: "transportation hire",
          id: "transportation-hire",
          quantity: 1,
          cost: -2000,
          isSelected: true
        }
      },
      outputs: {
        crop: {
          name: "crop",
          id: "crop",
          quantity: 5,
          consumed: 2,
          cost: 3000,
          isSelected: true
        }
      },
      familyLabour: {
        "family-labour": {
          name: "family labour",
          id: "family-labour",
          people: 4,
          days: 5,
          isSelected: true
        }
      },
      produceConsumed: {}
    }
  },
  description: "Example by Chris to test Maize budget",
  enterprise: null,
  _key: "_v3_Demo_Maize",
  periods: {
    labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    starting: "Oct",
    scale: "Months",
    total: 6
  },
  title: "Maize Demo (v3)",
  scale: null,
  enterpriseType: "crop",
  dotValues: {
    large: 50000,
    medium: 10000,
    small: 1000,
    half: 500
  }
};
