import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import reducer from './reducers'

//Redux store set-up
export default function store(preloadedState) {
  return createStore(
    reducer,
    preloadedState,
    applyMiddleware(thunk)
  )
}
