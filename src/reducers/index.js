import { combineReducers } from 'redux'
import stagedSearch, {selectors as stagedSelectors} from './stagedSearch'
import executedSearch, {selectors as executedSelectors} from './executedSearch'

export default combineReducers({
  stagedSearch,
  executedSearch
})
// export default (state = initialState, action) => {
//   switch (action.type) {

//     // case types.PAGE_LENGTH:
//     //   return {
//     //     ...state,
//     //     pageLength: action.payload
//     //   }

//     // case types.CONSTRAINT_ADD: {
//     //   let c = action.payload
//     //   let constraints = {...state.constraints}
//     //   let constraint = constraints[c.name] =  {...constraints[c.name]}
//     //   constraint.values = [...(constraint.values || []), c.value]

//     //   return {
//     //     ...state,
//     //     constraints
//     //   }
//     // }

//     // case types.CONSTRAINT_REMOVE: {
//     //   let c = action.payload
//     //   let constraints = {...state.constraints}
//     //   let constraint = constraints[c.name] = {...constraints[c.name]}
//     //   if (constraint && constraint.values) {
//     //     constraint.values = constraint.values.filter(x => x !== c.value)
//     //   }

//     //   return {
//     //     ...state,
//     //     constraints
//     //   }
//     // }

//     // case types.SUGGEST_REQUESTED:
//     //   return {
//     //     ...state,
//     //     suggestPending: true,
//     //     suggestQueryText: action.payload || ''
//     //   }

//     // case types.SUGGEST_SUCCESS:
//     //   return {
//     //     ...state,
//     //     suggestPending: false,
//     //     // suggestQueryText: '',
//     //     suggestions: action.payload.suggestions || []
//     //   }

//     // case types.SUGGEST_FAILURE:
//     //   return {
//     //     ...state,
//     //     // TODO: put error somewhere
//     //     suggestPending: false,
//     //     // suggestQueryText: '',
//     //     suggestions: []
//     //   }

//     // case types.OPTIONS_REQUESTED:
//     //   return {
//     //     ...state,
//     //     optionsPending: true
//     //   }

//     // case types.OPTIONS_SUCCESS: {
//     //   let opts = action.payload.options
//     //   let constraints = {}
//     //   opts.constraint.forEach(c => constraints[c.name] = c)
//     //   return {
//     //     ...state,
//     //     optionsPending: false,
//     //     // TODO: merge values?
//     //     constraints: constraints,
//     //     options: opts
//     //   }
//     // }

//     // case types.OPTIONS_FAILURE:
//     //   return {
//     //     ...state,
//     //     // TODO: put error somewhere
//     //     optionsPending: false,
//     //     options: {}
//     //   }

//     default:
//       return state
//   }
// }

// SELECTORS
const bindSelector = (selector, mountPoint) => {
  return (state, ...args) => {
    return selector(state[mountPoint], ...args)
  }
}

const bindSelectors = (selectors, mountPoint) => {
  return Object.keys(selectors).reduce((bound, key) => {
    bound[key] = bindSelector(selectors[key], mountPoint)
    return bound
  }, {})
}

export const selectors = {
  ...bindSelectors(executedSelectors, 'executedSearch'),
  ...bindSelectors(stagedSelectors, 'stagedSearch')
}
