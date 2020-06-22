/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const resetPassword = async (
  passwordReset,
  passwordConfirmReset,
  token
) => {
  //console.log('takis', passwordReset, passwordConfirmReset, token);
  //console.log('url', `/api/v1/users/resetPassword/${token}`);

  try {
    const res = await axios({
      method: 'PATCH',
      //url: `http://127.0.0.1:3000/api/v1/users/resetPassword/${token}`,
      url: `/api/v1/users/resetPassword/${token}`,
      data: {
        password: passwordReset,
        passwordConfirm: passwordConfirmReset,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Your password has been reset successfully!');
      window.setTimeout(() => {
        location.replace('/');
      }, 1500);
    }

    //console.log(res);
  } catch (err) {
    console.log(err.response);
    //showAlert('error', err.response.data.message);
    //`Invalid input data. ${err.response.data.message.split(':')[1]}!`
    showAlert('error', `${err.response.data.message}!`);
  }
};
