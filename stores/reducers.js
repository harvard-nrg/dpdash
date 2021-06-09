import { combineReducers } from 'redux';
import { isBrowser } from '../server/utils/browserUtil';

function subject(state = isBrowser() ? window.SUBJECT : null, action) {
  return state
}

function graph(state = isBrowser() ? window.GRAPH : null, action) {
  return state
}

function user(state = isBrowser() ? window.USER : null, action) {
  return state
}

const rootReducer = combineReducers({
  graph,
  user,
  subject
})

export default rootReducer
