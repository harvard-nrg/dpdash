import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import AccountPage from './Account.react'
import store from '../stores/store'

const reduxStore = store()

render(<Provider store={reduxStore}><AccountPage /></Provider>, document.getElementById('main'));
