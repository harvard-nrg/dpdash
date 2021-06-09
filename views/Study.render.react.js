import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import Study from './Study.react'
import store from '../stores/store'

const reduxStore = store()

render(<Provider store={reduxStore}><Study /></Provider>, document.getElementById('graph'))
