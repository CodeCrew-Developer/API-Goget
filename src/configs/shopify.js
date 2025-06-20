const axios = require("axios");

const shopify = axios.create({
  baseURL: `${process.env.SHOPIFY_URL}/admin/api/${process.env.SHOPIFY_VERSION}`,
  headers: {
    "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS,
    "Content-Type": "application/json",
  },
});

const shopifyApi = {
  create: async ({
    fulfillmentOrders,
    trackingNumber,
    trackingUrl,
    trackingCompany,
  }) => {
    const mutation = `
      mutation fulfillOrder($fulfillment: FulfillmentInput!) {
          fulfillmentCreate(fulfillment: $fulfillment) {
              fulfillment {
                  id
                  status
                  trackingInfo {
                      number
                      url
                      company
                  }
              }
              userErrors {
                  field
                  message
              }
          }
      }
      `;

    try {
      const data = {
        query: mutation,
        variables: {
          fulfillment: {
            lineItemsByFulfillmentOrder: fulfillmentOrders,
            trackingInfo: {
              number: trackingNumber,
              url: trackingUrl,
              company: trackingCompany,
            },
            notifyCustomer: true,
          },
        },
      };
      console.log(data,"DATA_____")
      const response = await shopify.post("/graphql.json", data);
      console.log("Fulfillment created successfully:", response.data);
      return response.data?.data?.fulfillmentCreate;
    } catch (error) {
      console.error("Error creating fulfillment:", error);
      throw error;
    }
  },
  cancel: async ({ fulfillmentId }) => {
    const mutation = `
        mutation fulfillmentCancel($id: ID!) {
            fulfillmentCancel(id: $id) {
                fulfillment {
                    id
                    status
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    try {
      const response = await shopify.post("/graphql.json", {
        query: mutation,
        variables: {
          id: fulfillmentId,
        },
      });
      console.log("Fulfillment cancelled successfully:", response.data);
      return response.data.data.fulfillmentCancel;
    } catch (error) {
      console.error("Error cancelling fulfillment:", error);
      throw error;
    }
  },
};

module.exports = shopifyApi;
