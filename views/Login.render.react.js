import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import LoginPage from './Login.react';
import store from '../stores/store';

const reduxStore = store();

render(<Provider store={reduxStore}><LoginPage /></Provider>, document.getElementById('main'));
