/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (
  name,
  emailSignup,
  passwordSignup,
  passwordConfirm
) => {
  try {
    const res = await axios({
      method: 'POST',
      //url: 'http://127.0.0.1:3000/api/v1/users/signup',
      url: '/api/v1/users/signup',
      data: {
        name: name,
        email: emailSignup,
        password: passwordSignup,
        passwordConfirm: passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Account successfully created!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }

    //console.log(res);
  } catch (err) {
    console.log(err.response.data.message);
    //showAlert('error', err.response.data.message);
    //`Invalid input data. ${err.response.data.message.split(':')[1]}!`
    showAlert(
      'error',
      `Invalid input data. ${err.response.data.message.split(':')[1]}!`
    );
  }
};

// document.querySelector('.formsignup').addEventListener('submit', (e) => {
//   e.preventDefault();

//   //take email and password value that the user put in from the browser
//   const name = document.getElementById('name').value;
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;
//   const passwordConfirm = document.getElementById('passwordConfirm').value;

//   signup(name, email, password, passwordConfirm);
// });
