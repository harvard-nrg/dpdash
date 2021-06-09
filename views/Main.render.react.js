import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import MainPage from './Main.react';
import store from '../stores/store';

const reduxStore = store();

render(<Provider store={reduxStore}><MainPage /></Provider>, document.getElementById('main'));
