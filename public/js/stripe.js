/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_aJnmmfH3VEATZltKSflspWBb00vKhaWqnn');

export const bookTour = async (tourId) => {
  try {
    // 1) Get the checkout session form the API(server)
    // const session = await axios(
    //   `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    // );
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    //console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
