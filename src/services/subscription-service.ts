// src/services/subscription-service.ts
"use server";

// This service is heavily dependent on a real backend and a payment provider like PayPal.
// The functions are kept as placeholders for the backend integration.
// No mock logic is needed here as the UI will handle the simulated flow.

/**
 * Calls the backend to create a PayPal subscription order.
 * @param {string} planName - The name of the plan being subscribed to.
 * @returns {Promise<string | null>} The PayPal order ID, or null on error.
 */
export async function createPayPalOrder(planName: string): Promise<string | null> {
  // TODO: Backend Integration - Replace with an actual API call.
  // const response = await api.post('/subscriptions/create-order', { planName });
  // return response.orderID;
  console.log(`[Simulated] Creating PayPal order for plan: ${planName}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Return a dummy Order ID for the PayPal button to use
  return `SIM_ORDER_${Date.now()}`;
}

/**
 * Calls the backend to finalize and capture the payment after user approval on PayPal.
 * @param {string} orderID - The order ID from PayPal.
 * @returns {Promise<{ status: string } | null>} The result of the capture, or null on error.
 */
export async function capturePayPalOrder(orderID: string): Promise<{ status: string } | null> {
  // TODO: Backend Integration - Replace with an actual API call.
  // const response = await api.post('/subscriptions/capture-order', { orderID });
  // The backend would update the clinic's subscription status in the database here.
  // return response;
  console.log(`[Simulated] Capturing PayPal order: ${orderID}`);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return { status: 'COMPLETED' }; // Simulate a successful capture
}
