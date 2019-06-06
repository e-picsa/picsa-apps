// This data is automatically populated on first load and update from live when available
export const budgetMeta = {
  activities: [
    {
      name: "apply fertiliser",
      id: "apply-fertiliser"
    },
    {
      name: "apply pesticide",
      id: "apply-pesticide"
    },
    {
      name: "bagging",
      id: "bagging"
    },
    {
      name: "compost manure making",
      id: "compost-manure-making"
    },
    {
      name: "harvesting",
      id: "harvesting"
    },
    {
      name: "land clearing",
      id: "land-clearing"
    },
    {
      name: "marketing and selling",
      id: "marketing-and-selling"
    },
    {
      name: "mulching",
      id: "mulching"
    },
    {
      name: "ploughing",
      id: "ploughing"
    },
    {
      name: "shelling",
      id: "shelling"
    },
    {
      name: "sowing",
      id: "sowing"
    },
    {
      name: "storage",
      id: "storage"
    },
    {
      name: "threshing",
      id: "threshing"
    },
    {
      name: "transport",
      id: "transport"
    },
    {
      name: "watering",
      id: "watering"
    },
    {
      name: "weeding",
      id: "weeding"
    }
  ],
  inputs: [
    {
      name: "bags",
      id: "bags"
    },
    {
      name: "chemicals",
      id: "chemicals"
    },
    {
      name: "fertiliser",
      id: "fertiliser"
    },
    {
      name: "hire ox cart",
      id: "hire-ox-cart"
    },
    {
      name: "labour - paid",
      id: "labour---paid"
    },
    {
      name: "manure sacks",
      id: "manure-sacks"
    },
    {
      name: "manure wheelbarrows",
      id: "manure-wheelbarrows"
    },
    {
      name: "pot for storagePrvdr",
      id: "pot-for-storagePrvdr"
    },
    {
      name: "protective equipment",
      id: "protective-equipment"
    },
    {
      name: "seeds",
      id: "seeds"
    },
    {
      name: "sheller hire",
      id: "sheller-hire"
    },
    {
      name: "tools",
      id: "tools"
    },
    {
      name: "tractor hire",
      id: "tractor-hire"
    },
    {
      name: "transportation hire",
      id: "transportation-hire"
    },
    {
      name: "wood",
      id: "wood"
    }
  ],
  outputs: [
    {
      name: "crop",
      id: "crop"
    },
    {
      name: "manure for compost",
      id: "manure-for-compost"
    },
    {
      name: "money",
      id: "money"
    },
    {
      name: "wood",
      id: "wood"
    }
  ],
  familyLabour: [{ name: "family labour", id: "family-labour" }],
  enterprises: [
    { group: "crop", name: "maize", id: "maize" },
    { group: "crop", name: "rice", id: "rice" },
    { group: "crop", name: "beans", id: "beans" },
    { group: "crop", name: "soya beans", id: "soya-beans" },
    { group: "crop", name: "groundnuts", id: "groundnuts" },
    { group: "crop", name: "pigeon peas", id: "pigeon-peas" },
    { group: "crop", name: "cowpeas", id: "cowpeas" },
    { group: "crop", name: "sweet potatoes", id: "sweet-potatoes" },
    { group: "crop", name: "sorghum", id: "sorghum" },
    { group: "fish", name: "fish", id: "fish" },
    { group: "fruits", name: "avocado", id: "avocado" },
    { group: "fruits", name: "mangoes", id: "mangoes" },
    { group: "fruits", name: "paw-paw", id: "paw-paw" },
    { group: "fruits", name: "watermelon", id: "watermelon" },
    { group: "fruits", name: "mixed", id: "mixed" },
    { group: "fruits", name: "pumpkins", id: "pumpkins" },
    { group: "livestock", name: "cattle", id: "cattle" },
    { group: "livestock", name: "goats", id: "goats" },
    { group: "livestock", name: "sheep", id: "sheep" },
    { group: "livestock", name: "ducks", id: "ducks" },
    { group: "livestock", name: "chicken", id: "chicken" },
    { group: "livestock", name: "guinea fowl", id: "guinea-fowl" },
    { group: "livestock", name: "pigs", id: "pigs" }
  ]
};

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

export const DAYS = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];

export const defaults = {
  periods: {
    days: {
      labels: ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"],
      starting: "Mon",
      scale: "Days",
      total: 7
    }
  }
};
