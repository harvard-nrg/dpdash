import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import ResetPage from './Resetpw.react';
import store from '../stores/store';

const reduxStore = store();

render(<Provider store={reduxStore}><ResetPage /></Provider>, document.getElementById('main'));
