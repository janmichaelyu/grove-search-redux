/* global fetch, URL */
import * as bareTypes from '../actionTypes'

// TODO: remove /api/search? or just make it the actual defaultAPI below
// import searchAPI from './api/search'
require('isomorphic-fetch')

const defaultAPI = {
  search: searchQuery => {
    return fetch(new URL('/api/search/all', document.baseURI).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        ...searchQuery,
        queryText: undefined,
        filters: {and: [
          {
            type: 'queryText',
            value: searchQuery.queryText
          },
          ...searchQuery.filters
        ]}
      })
    }).then(response => {
      if (!response.ok) {
        return response.json().then(error => {
          throw new Error(error.message)
        })
      }
      return response.json()
    })
  }
}

export default config => {
  let types = bareTypes
  if (config && config.namespace) {
    types = Object.keys(types).reduce((newTypes, typeKey) => {
      newTypes[typeKey] = config.namespace + '/' + types[typeKey]
      return newTypes
    }, {})
  }

  const receiveSuccessfulSearch = (response, optionalArgs) => ({
    type: types.SEARCH_SUCCESS,
    payload: { response, ...optionalArgs }
  })

  const runSearch = (searchQuery, optionalArgs = {}) => {
    let searchAPI = defaultAPI
    if (optionalArgs.api) {
      searchAPI = optionalArgs.api
      delete optionalArgs.api
    }
    return dispatch => {
      dispatch({
        type: types.SEARCH_REQUESTED,
        payload: { query: searchQuery, ...optionalArgs }
      })

      // TODO: send a request directly to middle-tier
      // with query options, queryText, combined query object as object
      return searchAPI.search(searchQuery, optionalArgs).then(
        data => dispatch(receiveSuccessfulSearch(data, optionalArgs)),
        error => {
          console.warn('Error searching: ', error)
          dispatch({
            type: types.SEARCH_FAILURE,
            payload: { error: error.message, ...optionalArgs }
          })
        }
      )
    }
  }

  const clearSearchResults = (optionalArgs = {}) => ({
    type: types.CLEAR_SEARCH_RESULTS,
    payload: { ...optionalArgs }
  })

  // const suggest = (queryText) => {
  //   return (dispatch, getState) => {
  //     dispatch({ type: types.SUGGEST_REQUESTED, payload: queryText })

  //     let state = getState().search
  //     let query = qb.ext.combined(constraintQuery(state.constraints), state.queryText)

  //     return client.suggest(state.suggestQueryText, query, { options: 'all' })
  //       .then(response => {
  //         if (!response.ok) throw new Error('bad search')
  //         return response.json()
  //       })
  //       .then(
  //         response => dispatch({ type: types.SUGGEST_SUCCESS, payload: response }),
  //         response => dispatch({ type: types.SUGGEST_FAILURE, payload: response }),
  //       )
  //   }
  // }

  // const options = () => {
  //   return dispatch => {
  //     dispatch({ type: types.OPTIONS_REQUESTED })

  //     return client.options('all')
  //     // !response.ok?
  //       .then(response => response.json())
  //       .then(response => {
  //         if (!(response && response.options)) throw new TypeError('invalid options')
  //         return response
  //       })
  //       .then(
  //         response => dispatch({ type: types.OPTIONS_SUCCESS, payload: response }),
  //         response => dispatch({ type: types.OPTIONS_FAILURE, payload: response })
  //       )
  //   }
  // }

  const setQueryText = queryText => {
    return {
      type: types.SET_QUERYTEXT,
      payload: { queryText }
    }
  }

  const changePage = n => {
    return { type: types.CHANGE_PAGE, payload: { page: n } }
  }

  // const pageLength = (l) => {
  //   return dispatch => {
  //     dispatch({ type: types.PAGE_LENGTH, payload: l })
  //     return dispatch(runSearch())
  //   }
  // }

  const addFilter = (constraint, value, optional = {}) => ({
    type: types.FILTER_ADD,
    payload: { constraint, value, boolean: optional.boolean || 'and' }
  })

  const removeFilter = (constraint, value, optional = {}) => ({
    type: types.FILTER_REMOVE,
    payload: { constraint, value, boolean: optional.boolean || 'and' }
  })

  return {
    runSearch,
    receiveSuccessfulSearch,
    clearSearchResults,
    setQueryText,
    changePage,
    addFilter,
    removeFilter
  }
}
