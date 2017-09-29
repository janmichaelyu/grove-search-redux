/* eslint-env jest */
import reducer, { searchSelectors as selectors } from './reducers'
import deepFreeze from 'deep-freeze'
import * as types from './actionTypes'

// Various states described in test-helpers
import {
  initialState,
  userCreatedSearchState,
  pendingExecutedState,
  mockResults,
  mockSearchResponse,
  finishedExecutedState
} from './test-helpers'

describe('search reducer', () => {
  it('returns the initial state', () => {
    expect(reducer(undefined, {})).toEqual(initialState)
  })

  describe('SEARCH_REQUESTED', () => {
    it('hydrates the search based on preExecutedSearch', () => {
      expect(
        reducer(userCreatedSearchState, {
          type: types.SEARCH_REQUESTED
        })
      ).toEqual({
        ...pendingExecutedState,
        executedSearch: {
          ...pendingExecutedState.executedSearch,
          id: expect.any(String)
        }
      })
    })

    // This might become useful eventually, so leaving this idea here
    // it('allows the search query to be set explicitly with payload')

    it('clears the previous search', () => {
      const newInitialState = {
        ...finishedExecutedState,
        executedSearch: {
          ...finishedExecutedState,
          id: 'earlierSearchId',
          results: [1, 2, 3],
          query: {
            ...finishedExecutedState,
            qtext: 'earlier search qtext'
          }
        }
      }
      const resultingState = reducer(newInitialState, {
        type: types.SEARCH_REQUESTED,
        payload: {qtext: 'qtext'}
      })
      expect(resultingState).toEqual(pendingExecutedState)
      // Ensure that ids are different, because pendingExecutedState
      // uses expect.any(String) for id
      expect(
        selectors.getExecutedSearchId(resultingState)
      ).not.toEqual(
        selectors.getExecutedSearchId(newInitialState)
      )
    })
  })

  describe('SEARCH_SUCCESS', () => {
    it('updates executedSearch with results, facets, and turns off pending', () => {
      expect(
        reducer(pendingExecutedState, {
          type: types.SEARCH_SUCCESS,
          payload: {
            ...mockSearchResponse,
            id: 'pendingID'
          }
        })
      ).toEqual(finishedExecutedState)
    })

    it('eliminates race conditions')
  })

  describe('SEARCH_FAILURE', () => {
    it('adds error and removes pending state', () => {
      const failedState = {
        ...pendingExecutedState,
        executedSearch: {
          ...pendingExecutedState.executedSearch,
          pending: false,
          response: {
            ...pendingExecutedState.executedSearch.response,
            error: 'An error'
          }
        }
      }
      deepFreeze(failedState)
      expect(
        reducer(pendingExecutedState, {
          type: types.SEARCH_FAILURE,
          payload: { error: 'An error' }
        })
      ).toEqual(failedState)
    })

    it('eliminates race conditions')
  })

  describe('SET_QTEXT', () => {
    it('works', () => {
      const expectedState = {
        ...initialState,
        preExecutedSearch: {
          ...initialState.preExecutedSearch,
          qtext: 'new qtext'
        }
      }
      expect(
        reducer(initialState, {
          type: types.SET_QTEXT,
          payload: {qtext: 'new qtext'}
        })
      ).toEqual(expectedState)
    })
  })

  describe('getSearchResults', () => {
    it('works', () => {
      expect(selectors.getSearchResults(finishedExecutedState)).toEqual(mockResults)
    })
  })

  describe('getSearchTotal', () => {
    it('works', () => {
      expect(selectors.getSearchTotal(finishedExecutedState)).toEqual(1)
    })
  })

  describe('getSearchExecutionTime', () => {
    it('works', () => {
      expect(selectors.getSearchExecutionTime(finishedExecutedState)).toEqual(0.00198)
    })
  })

  describe('getSearchTotalPages', () => {
    it('works', () => {
      expect(selectors.getSearchTotalPages(finishedExecutedState)).toEqual(1)
    })
  })

  // describe('getConstraints', () => {
  //   it('works', () => {
  //     const constraints = [
  //       {
  //         Products: 'Hammer'
  //       }
  //     ]
  //     const mockState = {
  //       search: {
  //         ...finishedExecutedState,
  //         executedSearch: {
  //           ...finishedExecutedState.executedSearch,
  //           query: {
  //             ...finishedExecutedState.executedSearch.query,
  //             constraints: constraints
  //           }
  //         }
  //       }
  //     }
  //     expect(selectors.getConstraints(mockState)).toEqual(constraints)
  //   })
  // })

  describe('getPage', () => {
    it('works', () => {
      expect(selectors.getPage(finishedExecutedState)).toEqual(1)
    })
  })

  describe('getPageLength', () => {
    it('works', () => {
      expect(selectors.getPageLength(finishedExecutedState)).toEqual(10)
    })
  })

  // TODO: make these work by sending in actions instead of asserting on state
  // shape. It might be even better to test actions and selectors together,
  // using the one to assert on the other, leaving state shape as an untested
  // implementation detail.

  describe('getExecutedSearch', () => {
    it('works', () => {
      expect(
        selectors.getExecutedSearch(finishedExecutedState)
      ).toEqual(finishedExecutedState.executedSearch)
    })
  })

  describe('getExecutedSearchQuery', () => {
    it('works', () => {
      expect(
        selectors.getExecutedSearchQuery(finishedExecutedState)
      ).toEqual(finishedExecutedState.executedSearch.query)
    })
  })

  describe('getExecutedSearchQtext', () => {
    it('works', () => {
      expect(
        selectors.getExecutedSearchQtext(finishedExecutedState)
      ).toEqual(finishedExecutedState.executedSearch.query.qtext)
    })
  })

  describe('isSearchPending', () => {
    it('works when pending', () => {
      expect(selectors.isSearchPending(pendingExecutedState)).toEqual(true)
    })

    it('works when finished', () => {
      expect(selectors.isSearchPending(finishedExecutedState)).toEqual(false)
    })
  })

  describe('getPreExecutedQuery', () => {
    it('works', () => {
      expect(selectors.getPreExecutedQuery(userCreatedSearchState)).toEqual({
        qtext: 'qtext',
        page: 1,
        pageLength: 10
      })
    })
  })

  describe('getVisibleQtext', () => {
    it('works', () => {
      expect(selectors.getVisibleQtext(userCreatedSearchState)).toEqual('qtext')
    })
  })
})
