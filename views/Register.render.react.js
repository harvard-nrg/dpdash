import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import RegisterPage from './Register.react';
import store from '../stores/store';

const reduxStore = store();

render(<Provider store={reduxStore}><RegisterPage /></Provider>, document.getElementById('main'));
