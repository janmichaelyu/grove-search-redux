/* global require */
import * as bareTypes from '../actionTypes';

// TODO: remove /api/search? or just make it the actual defaultAPI below
// import searchAPI from './api/search'
require('isomorphic-fetch');

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
        filters: {
          and: [
            {
              type: 'queryText',
              value: searchQuery.queryText
            },
            ...(searchQuery.filters || [])
          ]
        }
      })
    }).then(response => {
      if (!response.ok) {
        return response.json().then(error => {
          throw new Error(error.message);
        });
      }
      return response.json();
    });
  },
  showMore: (facetName, facetValues, type, stagedSearch, queryText) => {
    // name, params, options, searchState, qtext, facetObject
    const name = facetName;
    const facetObject = facetValues;
    // let options = {};
    const searchState = stagedSearch;
    const qtext = queryText;

    return fetch('/v1/config/query/all?format=json', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      credentials: 'same-origin'
    }).then(
      response => {
        return response.json().then(function(json) {
          let options = json.options || {};

          let path = '';
          let collation = '';
          for (let i = 0; i < options.constraint.length; i++) {
            if (options.constraint[i].name === name) {
              path = options.constraint[i].range['path-index'].text;
              collation = options.constraint[i].range.collation;
            }
          }
          options.values = {
            name: name,
            range: {
              collation: collation,
              type: 'xs:string',
              'path-index': {
                text: path,
                ns: ''
              }
            },
            'values-option': ['frequency-order']
          };

          //combine with values
          let start = facetObject.length + 1 || 1;
          let pageLength = 10;
          var limit = start + pageLength - 1;

          let facets = Object.keys(searchState.activeFacets || {}).map(function(
            facetName
          ) {
            let constraintType = searchState.activeFacets[facetName].type;
            if (constraintType && constraintType.substring(0, 3) === 'xs:') {
              constraintType = 'range';
            }
            let temp = {
              'range-constraint-query': {
                'constraint-name': facetName,
                constraintType: constraintType
              }
            };
            searchState.activeFacets[facetName].values.map(function(
              facetValue
            ) {
              temp.value = [facetValue.value];
              if (facetValue.negated) {
                temp['range-operator'] = 'NE';
              }
            });

            return temp;
          });
          let valuesParams = new URLSearchParams();
          valuesParams.append('q', qtext);
          valuesParams.append('start', start);
          valuesParams.append('pageLength', String(pageLength));
          valuesParams.append('limit', String(limit));
          valuesParams.append('direction', 'descending');
          let valuesParamsString = valuesParams.toString();

          return fetch('/v1/values/' + name + '?' + valuesParamsString, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({
              search: {
                query: {
                  queries: {
                    and: [].concat(facets)
                  }
                },
                options: options
              }
            }),
            credentials: 'same-origin'
          }).then(
            response => {
              return response.json().then(function(json) {
                return { response: json };
              });
            },
            error => {
              throw new Error(error.message);
            }
          );
        });
      },
      error => {
        return error;
      }
    );
  }
};

export default config => {
  let types = bareTypes;
  if (config && config.namespace) {
    types = Object.keys(types).reduce((newTypes, typeKey) => {
      newTypes[typeKey] = config.namespace + '/' + types[typeKey];
      return newTypes;
    }, {});
  }

  const receiveSuccessfulSearch = (response, optionalArgs) => ({
    type: types.SEARCH_SUCCESS,
    payload: { response, ...optionalArgs }
  });

  const runSearch = (searchQuery, optionalArgs = {}) => {
    let searchAPI = defaultAPI;
    if (optionalArgs.api) {
      searchAPI = optionalArgs.api;
      delete optionalArgs.api;
    }
    return dispatch => {
      dispatch({
        type: types.SEARCH_REQUESTED,
        payload: { query: searchQuery, ...optionalArgs }
      });

      // TODO: consider changing shape of state instead of modifying
      // shape of query here
      const { page, pageLength, ...groveSearchQuery } = searchQuery;
      return searchAPI
        .search(
          {
            ...groveSearchQuery,
            options: {
              start:
                pageLength && page ? pageLength * (page - 1) + 1 : undefined,
              pageLength: pageLength
            }
          },
          optionalArgs
        )
        .then(
          data => dispatch(receiveSuccessfulSearch(data, optionalArgs)),
          error => {
            dispatch({
              type: types.SEARCH_FAILURE,
              payload: { error: error.message, ...optionalArgs }
            });
          }
        );
    };
  };

  const receiveSuccessfulValues = (response, optionalArgs) => ({
    type: types.VALUES_SUCCESS,
    payload: {
      response,
      ...optionalArgs
    }
  });

  const showMore = (
    facetName,
    facetValues,
    type,
    stagedSearch,
    queryText,
    optionalArgs = {}
  ) => {
    let valuesAPI = defaultAPI;
    if (optionalArgs.api) {
      valuesAPI = optionalArgs.api;
      delete optionalArgs.api;
    }
    return dispatch => {
      dispatch({
        type: types.VALUES_REQUESTED
      });

      return valuesAPI
        .showMore(
          facetName,
          facetValues,
          type,
          stagedSearch,
          queryText,
          optionalArgs
        )
        .then(
          data => {
            dispatch(receiveSuccessfulValues(data, optionalArgs));
          },
          error => {
            dispatch({
              type: types.VALUES_FAILURE,
              payload: {
                error: String(error),
                ...optionalArgs
              }
            });
          }
        );
    };
  };

  const clearSearchResults = (optionalArgs = {}) => ({
    type: types.CLEAR_SEARCH_RESULTS,
    payload: { ...optionalArgs }
  });

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
    };
  };

  const changePage = n => {
    return { type: types.CHANGE_PAGE, payload: { page: n } };
  };

  // const pageLength = (l) => {
  //   return dispatch => {
  //     dispatch({ type: types.PAGE_LENGTH, payload: l })
  //     return dispatch(runSearch())
  //   }
  // }

  const addFilter = (constraint, constraintType, values, optional = {}) => {
    values = values instanceof Array ? values : [values];
    return {
      type: types.FILTER_ADD,
      payload: {
        constraint,
        constraintType: constraintType || undefined,
        values,
        boolean: optional.boolean || 'and'
      }
    };
  };

  const removeFilter = (constraint, values, optional = {}) => {
    values = values instanceof Array ? values : [values];
    return {
      type: types.FILTER_REMOVE,
      payload: { constraint, values, boolean: optional.boolean || 'and' }
    };
  };

  const clearFilter = (constraint, optional = {}) => ({
    type: types.FILTER_CLEAR,
    payload: { constraint, ...optional }
  });

  const replaceFilter = (constraint, constraintType, values, optional = {}) => {
    // TODO: DRY UP with addFilter?
    values = values instanceof Array ? values : [values];
    return {
      type: types.FILTER_REPLACE,
      payload: {
        constraint,
        constraintType: constraintType || undefined,
        values,
        boolean: optional.boolean || 'and'
      }
    };
  };

  return {
    runSearch,
    receiveSuccessfulSearch,
    clearSearchResults,
    setQueryText,
    changePage,
    addFilter,
    removeFilter,
    replaceFilter,
    clearFilter,
    showMore,
    receiveSuccessfulValues
  };
};
