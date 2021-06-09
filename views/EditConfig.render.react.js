import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import EditConfig from './EditConfig.react'
import store from '../stores/store'

const reduxStore = store()

render(<Provider store={reduxStore}><EditConfig /></Provider>, document.getElementById('main'));
