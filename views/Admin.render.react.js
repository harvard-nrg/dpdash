import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import AdminPage from './Admin.react';
import store from '../stores/store';

const reduxStore = store();

render(<Provider store={reduxStore}><AdminPage /></Provider>, document.getElementById('main'));
