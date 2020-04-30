import React from 'react'
import ReactDOM from 'react-dom'
import gql from "graphql-tag"

import { ApolloProvider } from 'react-apollo'
import { ApolloClient } from 'apollo-client'
import { createHttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { BrowserRouter } from 'react-router-dom'
import { setContext } from 'apollo-link-context'

import { split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'

import './styles/index.css'
import { AUTH_TOKEN } from './constants'
import App from './components/App'
import * as serviceWorker from './serviceWorker';

const endPoint = "morning-sands-20248.herokuapp.com"
//  uri: 'http://localhost:4000'

/*
ApolloLinkの作成
ApolloClinetは これを通して ServerのGraphQL API に接続する
Serverの uri は以下のとおり
*/
const httpLink = createHttpLink({
  uri: 'https://' + endPoint + '/',
})

/*
ApolloLinkの作成
与えられた contextを展開し、authorization tokenを付け加える
*/
const authLink = setContext(
  (_, { orgContext }) => {
  const token = localStorage.getItem(AUTH_TOKEN)
  return {
    headers: {
      ...orgContext,
      authorization: token ? `Bearer ${token}` : ''
    }
  }
})

/**
 WebSocketの作成 subscription用
 */
const wsLink = new WebSocketLink({
  uri: 'wss://' + endPoint + '/',
  options: {
    reconnect: true,
    connectionParams: {
      authToken: localStorage.getItem(AUTH_TOKEN),
    }
  }
})

/**
 server接続の route分け
 3つの引数
 1. test関数。チェック後 tureなら 2番目の引数に指定されたlinkへ接続
 2. test関数 結果true の接続 (Subscription)
 3. test関数 結果falseの接続 (Query/Mutation)
 */
const link = split (
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query)
    return kind === 'OperationDefinition' && operation === 'subscription'
  },
  wsLink,
  authLink.concat(httpLink)
)

// ApolloClientの生成
// link : server接続先(authorization token付き)を指定
// cache: 正規化(冗長部分を除いた)キャッシュ機能指定で高速化
const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
  onError: ({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      console.log(graphQLErrors.toString())
    }
    if (networkError) {
      console.log(networkError.toString())
    }
  }
})

const query = gql`
  {
    info
  }
`

client
  .query({
    query
  })
  .then(result => console.log(result));

/*
propとして clientを指定し
Rootとなる Appを
<ApolloProvider /> でラッピングする
<BrowserRouter /> で route機能を有効にする
*/
ReactDOM.render(
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
