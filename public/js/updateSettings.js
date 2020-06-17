/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

//type is either 'password' or 'data
export const updateSettings = async (data, type) => {
  try {
    // const url =
    //   type === 'password'
    //     ? 'http://127.0.0.1:3000/api/v1/users/updateMyPasswords'
    //     : 'http://127.0.0.1:3000/api/v1/users/updateMe';
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPasswords'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
      window.setTimeout(() => {
        location.reload(true);
      }, 1000);
    }

    //console.log(res);
  } catch (err) {
    //console.log(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};
