const axios = require("axios");

const shopify = axios.create({
  baseURL: `${process.env.SHOPIFY_URL}/admin/api/${process.env.SHOPIFY_VERSION}`,
  headers: {
    "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS,
    "Content-Type": "application/json",
  },
});

const shopifyApi = {
    create: async ({fulfillmentOrderId, lineItems, trackingNumber, trackingUrl, trackingCompany}) => {
        const mutation = `
        mutation fulfillOrder($fulfillment: FulfillmentV2Input!) {
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
            const response = await shopify.post("/graphql.json", {
                query: mutation,
                variables: {
                    fulfillment: {
                        lineItemsByFulfillmentOrder: [
                            {
                                fulfillmentOrderId,
                                fulfillmentOrderLineItems: lineItems,
                            },
                        ],
                        trackingInfo: {
                            number: trackingNumber,
                            url: trackingUrl,
                            company: trackingCompany
                        }
                    },
                },
            });
            console.log("Fulfillment created successfully:", response.data);
            return response.data.data.fulfillmentCreate;
        } catch (error) {
            console.error("Error creating fulfillment:", error);
            throw error;
        }
    },
};

module.exports = shopifyApi;
