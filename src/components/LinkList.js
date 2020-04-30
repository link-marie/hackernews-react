import React, { Component, Fragment } from 'react'
import { Query } from 'react-apollo'
import gql from 'graphql-tag'

import Link from './Link'
import { LINKS_PER_PAGE } from '../constants'

// GraphQL queryを gqlで GraphQL ASTへ変換
export const FEED_QUERY = gql`

  query FeedQuery($first: Int, $skip: Int, $orderBy: LinkOrderByInput) {
    feed(first: $first, skip: $skip, orderBy: $orderBy) {
      links {
        id
        createdAt
        url
        description
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      count
    }
  }
`

const NEW_LINKS_SUBSCRIPTION = gql`
  subscription {
    newLink {
      id
      url
      description
      createdAt
      postedBy {
        id
        name
      }
      votes {
        id
        user {
          id
        }
      }
    }
  }
`

const NEW_VOTES_SUBSCRIPTION = gql`
  subscription {
    newVote {
      id
      link {
        id
        url
        description
        createdAt
        postedBy {
          id
          name
        }
        votes {
          id
          user {
            id
          }
        }
      }
      user {
        id
      }
    }
  }
`

class LinkList extends Component {
  render() {

    // <Query />を返す
    return (
      // FEED_QUERYを propsとして指定
      <Query
        query={FEED_QUERY}
        variables={this._getQueryVariables()}
      >
        { /* 
        RenderPropFunctionの定義。 
        FEED_QUERYの結果がこの関数に渡される。
        */}
        {({ loading, error, data, subscribeToMore }) => {
          /* データ取得中? */
          if (loading) return <div>Fetching..</div>
          /* データ取得できない? */
          if (error) return <div>Error</div>

          // 新しいLink投稿時のイベント
          this._subscribeToNewLinks(subscribeToMore)
          this._subscribeToNewVotes(subscribeToMore)

          /* 表示データ */
          const linksToRender = this._getLinksToRender(data)
          // 新規投稿ページかどうか
          const isNewPage = this.props.location.pathname.includes('new')
          // 現在のページ番号より リンクのindexのオフセットを求める
          const pageIndex = this.props.match.params.page
            ? (this.props.match.params.page - 1) * LINKS_PER_PAGE
            : 0

          return (
            <Fragment>
              {/* 取得したデータの内容を 一つずつ処理 */}
              {linksToRender.map((link, index) => (
                // <Link />の戻され方を定義
                <Link
                  key={link.id}
                  link={link}
                  index={index + pageIndex}
                  updateStoreAfterVote={this._updateCacheAfterVote1}
                />
              ))}

              {isNewPage && (
                /** Navigation */
                <div className="flex ml4 mv3 gray">
                  <div className="pointer mr2"
                    onClick={() => this._previousPage()}
                  >
                    Previous
                  </div>
                  <div className="pointer mr2"
                    onClick={() => this._nextPage(data)}
                  >
                    Next
                  </div>
                </div>
              )}
            </Fragment>
          )
        }}
      </Query>
    )
  }

  /**
   Vote/Unvote 実行後の 内部Cacheの update
   */
  _updateCacheAfterVote1 = (store, votes, linkId) => {

    const isNewPage = this.props.location.pathname.includes('new')
    const page = parseInt(this.props.match.params.page, 10)

    // ページ表示パラメータ
    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0
    const first = isNewPage ? LINKS_PER_PAGE : 100
    const orderBy = isNewPage ? 'createdAt_DESC' : null

    // 現在のCacheから 内部データを読み込む
    const localData = store.readQuery({
      query: FEED_QUERY,
      variables: { first, skip, orderBy }
    })
    // 指定されたIDの linkを得る
    const localLink = localData.feed.links.find(link => link.id === linkId)
    // 内部Vote情報を更新
    localLink.votes = votes
    // 内部Cacheを更新
    store.writeQuery({
      query: FEED_QUERY,
      data: localData
    })
  }

  /**
   * 新しい投稿が行われた時、Client上で自動更新されるようにする
   * 
   * 投稿が行われたら、
   * document:    登録した Queryを実行し、
   * updateQuery: Query結果を統合してその結果を戻す
   */
  _subscribeToNewLinks = (subscribeToMore) => {

    subscribeToMore({

      // Subscription実行時の処理
      document: NEW_LINKS_SUBSCRIPTION,

      // subscriptonイベントを受信した時の処理
      // prev:             subscription前のデータ
      // subscriptionData: イベント発生時に受け取るデータ
      updateQuery: (prev, { subscriptionData }) => {

        // データが受け取れなかったら、そのまま前のデータを戻す
        if (!subscriptionData.data) return prev

        // 'document:' で定義した処理で実行した subscription情報を得る
        const newLink = subscriptionData.data.newLink
        // すでに登録済み?
        const exists = prev.feed.links.find(({ id }) =>
          id === newLink.id
        )
        // 登録済みなら そのまま前のデータを戻す
        if (exists) return prev

        // 元と新データを 複製統合して、結果を戻す
        return Object.assign({}, prev, {
          feed: {
            // link データを統合
            links: [newLink, ...prev.feed.links],
            // count up
            count: prev.feed.links.length + 1,
            // 型を参照する
            __typename: prev.feed.__typename
          }
        })
      }
    })
  }

  /**
   新しい評価が行われた時、Client上で自動更新されるようにする
   */
  _subscribeToNewVotes = subscribeToMore => {
    subscribeToMore({
      // Subscription実行時の処理。
      // 新規評価を問い合わせる
      // Clientで評価が自動更新される
      document: NEW_VOTES_SUBSCRIPTION
    })
  }

  /**
   Page用パラメータの取得
   */
  _getQueryVariables = () => {

    // listを いくつskipして検索を開始するか
    let skip = 0
    // skipした位置からいくつ linkを取得するか
    let first = 100
    // listの並び替え
    let orderBy = null

    // 新規投稿ページか
    const isNewPage = this.props.location.pathname.includes('new')
    if (isNewPage) {
      // routerより 現在のページ番号を得る(10進数で)
      const page = parseInt(this.props.match.params.page, 10)

      skip = (page - 1) * LINKS_PER_PAGE
      first = LINKS_PER_PAGE
      orderBy = 'createdAt_DESC'
    }

    return { first, skip, orderBy }
  }

  /**
   * 表示するデータを得る
   */
  _getLinksToRender = data => {
    // 新規投稿ページか
    const isNewPage = this.props.location.pathname.includes('new')
    if( isNewPage) {
      // linkデータをそのまま参照
      return data.feed.links
    }

    // Sortするためshallow copy
    const rankedLinks = data.feed.links.slice()
    // Vote数でソート
    rankedLinks.sort((l1, l2) => l2.votes.length - l1.votes.length)
    return rankedLinks
  }

  /**
   次のページへ移動
   */
  _nextPage = data => {
    // 現在のページ番号を得る
    const page = parseInt(this.props.match.params.page, 10)
    // 次のページがある?
    if( page <= data.feed.count / LINKS_PER_PAGE) {
      // 次のページを設定
      const nextPage = page + 1
      // Routeを指定
      this.props.history.push(`/new/${nextPage}`)
    }
  }

  /**
   前のページへ移動
   */
  _previousPage = () => {
    // 現在のページ番号を得る
    const page = parseInt(this.props.match.params.page, 10)
    // 前のページがある?
    if( page > 1) {
      // 前のページを設定
      const previousPage = page - 1
      // Routeを指定
      this.props.history.push(`/new/${previousPage}`)
    }
  }

}

export default LinkList
