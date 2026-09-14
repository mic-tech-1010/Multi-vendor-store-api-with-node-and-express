export const checkDeliverySchema = {
  type: "object",

  required: [
    "id",
    "formattedAddress",
    "coordinates",
  ],

  properties: {
    id: {
      type: "string",
    },

    name: {
      type: "string",
    },

    formattedAddress: {
      type: "string",
    },

    coordinates: {
      type: "object",

      required: [
        "latitude",
        "longitude",
      ],

      properties: {
        latitude: {
          type: "number",
        },

        longitude: {
          type: "number",
        },
      },

      additionalProperties: false,
    },

    street: {
      type: "string",
      nullable: true,
    },

    city: {
      type: "string",
      nullable: true,
    },

    suburb: {
      type: "string",
      nullable: true,
    },

    municipality: {
      type: "string",
      nullable: true,
    },

    state: {
      type: "string",
      nullable: true,
    },

    state_code: {
      type: "string",
      nullable: true,
    },

    postalCode: {
      type: "string",
      nullable: true,
    },

    country: {
      type: "string",
      nullable: true,
    },

    result_type: {
      type: "string",
      nullable: true,
    },

    housenumber: {
      type: "string",
      nullable: true,
    },
  },

  additionalProperties: false,
} as const;