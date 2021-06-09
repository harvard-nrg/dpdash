import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import ConfigPage from './Config.react'
import store from '../stores/store'

const reduxStore = store()

render(<Provider store={reduxStore}><ConfigPage /></Provider>, document.getElementById('main'));
