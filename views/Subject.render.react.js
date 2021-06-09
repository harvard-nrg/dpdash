import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import Subject from './Subject.react'
import store from '../stores/store'

const reduxStore = store()

render(<Provider store={reduxStore}><Subject /></Provider>, document.getElementById('graph'))
