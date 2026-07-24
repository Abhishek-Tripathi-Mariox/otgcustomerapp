declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    key: string;
    order_id: string;
    amount: number;
    currency?: string;
    name?: string;
    description?: string;
    image?: string;
    prefill?: {email?: string; contact?: string; name?: string};
    theme?: {color?: string};
    notes?: Record<string, string>;
  }

  export interface RazorpaySuccessResult {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }

  // Rejection shape when the checkout sheet closes without a successful
  // payment. `code === 0` (or `2` on some SDK versions) means the user
  // dismissed/cancelled the sheet; any other code is a real gateway/network
  // failure and should be messaged differently to the user.
  export interface RazorpayErrorResult {
    code: number;
    description: string;
  }

  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResult>;
  };

  export default RazorpayCheckout;
}
