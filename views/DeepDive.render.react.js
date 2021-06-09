import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import DeepDive from './DeepDive.react'
import store from '../stores/store'

const reduxStore = store()

render(<Provider store={reduxStore}><DeepDive /></Provider>, document.getElementById('main'));
