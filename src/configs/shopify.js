const axios = require("axios");

const shopify = axios.create({
  baseURL: `${process.env.SHOPIFY_URL}/admin/api/${process.env.SHOPIFY_VERSION}`,
  headers: {
    "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS,
    "Content-Type": "application/json",
  },
});

const shopifyApi = {
getFulfillmentOrders: async (orderId) => {
    console.log("fulfillmentOrders", orderId);
    
    // Ensure orderId is in the correct format
    const formattedOrderId = `gid://shopify/Order/${orderId}`;
    
    const query = `
      query getFulfillmentOrders($id: ID!) {
        order(id: $id) {
          id
          name
          customer {
            firstName
            lastName
            email
            phone
          }
          fulfillmentOrders(first: 50) {
            nodes {
              id
              status
              requestStatus
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    totalQuantity
                    remainingQuantity
                    variant {
                      id
                      title
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await shopify.post("/graphql.json", {
        query,
        variables: { id: formattedOrderId },
      });

      console.log("GraphQL Response:", JSON.stringify(response.data, null, 2));

      // Check for GraphQL errors
      if (response.data.errors) {
        console.error("GraphQL errors:", response.data.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(response.data.errors)}`);
      }

      // Check if order exists
      if (!response.data.data || !response.data.data.order) {
        throw new Error(`Order not found with ID: ${formattedOrderId}`);
      }

      const order = response.data.data.order;
      const customer = order.customer;
      const fulfillmentOrders = order.fulfillmentOrders?.nodes || [];

      if (fulfillmentOrders.length === 0) {
        console.log("No fulfillment orders found for this order");
        return [];
      }

      // Map to match create fulfillment input format (only allowed fields)
      const formatted = fulfillmentOrders.filter((fo) => fo.status !== "CLOSED").map((fo) => ({
        fulfillmentOrderId: fo.id,
        fulfillmentOrderLineItems: fo.lineItems.edges.map((edge) => ({
          id: edge.node.id,
          quantity: edge.node.totalQuantity,
        })),
      }));

      console.log("Formatted fulfillment orders:", formatted);
      return {formatted,customer};
      
    } catch (error) {
      console.error("Error fetching fulfillment orders:");
      console.error("Error message:", error.message);
      console.error("Response data:", error?.response?.data);
      console.error("Full error:", error);
      throw error;
    }
  },
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
