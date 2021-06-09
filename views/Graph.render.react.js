import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import Graph from './Graph.react'
import store from '../stores/store'

const reduxStore = store()

render(<Provider store={reduxStore}><Graph /></Provider>, document.getElementById('graph'))
