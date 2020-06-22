/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const forgotPassword = async (email) => {
  //console.log(email);

  try {
    const res = await axios({
      method: 'POST',
      //url: 'http://127.0.0.1:3000/api/v1/users/forgotPassword',
      url: '/api/v1/users/forgotPassword',
      data: {
        email: email,
      },
    });

    if (res.data.status === 'success') {
      showAlert(
        'success',
        `We have sent a reset password email to ${email}. Please click the reset password link to set your new password.`,
        15
      );
      // window.setTimeout(() => {
      //     location.assign('/');
      // }, 1500);
    }

    //console.log(res);
  } catch (err) {
    //console.log(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};
